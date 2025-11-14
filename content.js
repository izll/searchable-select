(function() {
  'use strict';

  // Már konvertált select elemek tárolása
  const convertedSelects = new WeakSet();

  // Beállítások
  let settings = {
    enableAllDomains: true,
    allowedDomains: [],
    enableDebugLogs: false,
    language: 'hu' // Alapértelmezett nyelv
  };

  // Debug log helper - csak akkor ír ki, ha engedélyezve van
  function debugLog(...args) {
    if (settings.enableDebugLogs) {
      console.log(...args);
    }
  }

  // Get translated message based on selected language
  async function getLocalizedMessage(key, lang) {
    try {
      const messagePath = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
      const response = await fetch(messagePath);
      const messages = await response.json();

      if (messages[key] && messages[key].message) {
        return messages[key].message;
      }
      return chrome.i18n.getMessage(key); // Fallback to browser language
    } catch (error) {
      debugLog('Error loading translation:', error);
      return chrome.i18n.getMessage(key); // Fallback to browser language
    }
  }

  // Aktuális domain ellenőrzése
  function isCurrentDomainAllowed() {
    // Ha minden domain engedélyezve van
    if (settings.enableAllDomains) {
      return true;
    }

    // Aktuális hostname
    const currentHostname = window.location.hostname;

    // Ha nincs engedélyezett domain, ne működjön
    if (!settings.allowedDomains || settings.allowedDomains.length === 0) {
      return false;
    }

    // Ellenőrizzük, hogy az aktuális domain szerepel-e a listában
    return settings.allowedDomains.some(domain => {
      // Wildcard (*) támogatás
      if (domain.includes('*')) {
        // *.example.com -> .example.com
        const pattern = domain.replace(/\*/g, '.*').replace(/\./g, '\\.');
        const regex = new RegExp('^' + pattern + '$', 'i');
        return regex.test(currentHostname);
      }

      // Pontos egyezés
      return currentHostname === domain || currentHostname.endsWith('.' + domain);
    });
  }

  // Beállítások betöltése
  function loadSettings(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get({
        enableAllDomains: true,
        allowedDomains: [],
        enableDebugLogs: false,
        language: chrome.i18n.getUILanguage().split('-')[0]
      }, function(items) {
        settings = items;
        debugLog('Searchable Select: Beállítások betöltve', settings);
        if (callback) callback();
      });
    } else {
      // Ha nincs elérhető a storage API (pl. lokális tesztelés)
      if (callback) callback();
    }
  }

  // Select elem konvertálása Choices.js-re
  async function convertSelect(selectElement) {
    // Ellenőrizzük, hogy már konvertálva lett-e
    if (convertedSelects.has(selectElement)) {
      return;
    }

    // Ellenőrizzük, hogy van-e már Choices instance rajta
    if (selectElement.classList.contains('choices__input')) {
      return;
    }

    // Ellenőrizzük, hogy a select parent létezik-e a DOM-ban
    if (!document.body.contains(selectElement)) {
      return;
    }

    try {
      // Fordítások betöltése
      const lang = settings.language || 'hu';
      const searchPlaceholder = await getLocalizedMessage('searchPlaceholder', lang);
      const noResults = await getLocalizedMessage('noResults', lang);
      const noChoices = await getLocalizedMessage('noChoices', lang);
      const loading = await getLocalizedMessage('loading', lang);

      // Choices.js inicializálása keresés támogatással
      const choices = new Choices(selectElement, {
        searchEnabled: true,
        searchPlaceholderValue: searchPlaceholder,
        searchResultLimit: Infinity, // Teszt: minden találat megjelenítése
        itemSelectText: '', // Üres string - nem mutat semmit
        noResultsText: noResults,
        noChoicesText: noChoices,
        loadingText: loading,
        removeItemButton: false,
        shouldSort: false,
        position: 'auto',
        allowHTML: false
      });

      // Jelöljük meg, hogy konvertálva lett
      convertedSelects.add(selectElement);

      debugLog('Searchable Select: select elem konvertálva', selectElement);
    } catch (error) {
      console.error('Searchable Select: Hiba a select konvertálása során:', error);
    }
  }

  // Késleltetett konverzió dinamikus elemekhez - többszöri próbálkozás
  function convertSelectDelayed(selectElement) {
    // Próbáljuk meg azonnal
    convertSelect(selectElement);

    // Több lépcsős újrapróbálkozás
    if (!convertedSelects.has(selectElement)) {
      setTimeout(() => {
        if (!convertedSelects.has(selectElement)) {
          convertSelect(selectElement);
        }
      }, 50);

      setTimeout(() => {
        if (!convertedSelects.has(selectElement)) {
          convertSelect(selectElement);
        }
      }, 150);

      setTimeout(() => {
        if (!convertedSelects.has(selectElement)) {
          convertSelect(selectElement);
        }
      }, 300);

      setTimeout(() => {
        if (!convertedSelects.has(selectElement)) {
          debugLog('Searchable Select: Select konverzió több próbálkozás után', selectElement);
          convertSelect(selectElement);
        }
      }, 500);
    }
  }

  // Összes select elem konvertálása az oldalon
  function convertAllSelects() {
    const selects = document.querySelectorAll('select:not(.choices__input):not(.choices__input--cloned)');
    debugLog('Searchable Select: convertAllSelects() - talált select elemek:', selects.length);

    if (selects.length > 0) {
      let convertedCount = 0;
      let alreadyConvertedCount = 0;

      selects.forEach(select => {
        if (convertedSelects.has(select)) {
          alreadyConvertedCount++;
        } else {
          convertSelect(select);
          if (convertedSelects.has(select)) {
            convertedCount++;
          }
        }
      });

      debugLog('Searchable Select: Újonnan konvertálva:', convertedCount, 'Már konvertált:', alreadyConvertedCount);
    } else {
      debugLog('Searchable Select: Nincs konvertálandó select elem');
    }
  }

  // MutationObserver a dinamikusan hozzáadott select elemek és iframe-ek figyelésére
  let observer = null;
  let observerTimeout = null;

  function initObserver() {
    if (observer || !document.body) {
      return;
    }

    let mutationBuffer = [];
    let isProcessing = false;

    observer = new MutationObserver(mutations => {
      // Mutation buffer hozzáadása
      mutationBuffer.push(...mutations);

      // Debounce: várunk egy kicsit, hogy több mutáció egyben kezelődjön
      if (observerTimeout) {
        clearTimeout(observerTimeout);
      }

      // Concurrent processing megelőzése
      if (isProcessing) {
        return;
      }

      observerTimeout = setTimeout(() => {
        isProcessing = true;

        const selectsToConvert = new Set();
        const framesToProcess = new Set();

        mutationBuffer.forEach(mutation => {
          // Korai kilépés ha nincs hozzáadott node
          if (mutation.addedNodes.length === 0) {
            return;
          }

          // Hozzáadott elemek vizsgálata
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Ha az elem maga egy frame vagy iframe
              if (node.tagName === 'IFRAME' || node.tagName === 'FRAME') {
                framesToProcess.add(node);
              }
              // Ha az elem maga egy select
              else if (node.tagName === 'SELECT' &&
                       !node.classList.contains('choices__input') &&
                       !node.classList.contains('choices__input--cloned')) {
                selectsToConvert.add(node);
              }
              // Ha az elem tartalmaz select elemeket vagy frame-eket
              else if (node.querySelectorAll) {
                // Select elemek keresése
                const selects = node.querySelectorAll('select:not(.choices__input):not(.choices__input--cloned)');
                selects.forEach(select => {
                  selectsToConvert.add(select);
                });

                // Frame és iframe elemek keresése
                const frames = node.querySelectorAll('frame, iframe');
                frames.forEach(frame => {
                  framesToProcess.add(frame);
                });
              }
            }
          });
        });

        // Buffer törlése
        mutationBuffer = [];

        // Konvertáljuk az összegyűjtött select elemeket
        if (selectsToConvert.size > 0) {
          debugLog('Searchable Select: ' + selectsToConvert.size + ' új select elem észlelve');
          selectsToConvert.forEach(select => {
            convertSelectDelayed(select);
          });
        }

        // Feldolgozzuk az új frame-eket és iframe-eket
        if (framesToProcess.size > 0) {
          debugLog('Searchable Select: ' + framesToProcess.size + ' új frame/iframe elem észlelve');
          framesToProcess.forEach(frame => {
            // Ha az iframe már betöltött, feldolgozzuk most
            if (frame.contentDocument && frame.contentDocument.readyState === 'complete') {
              setTimeout(() => processFrame(frame), 100);
            } else {
              // Különben várunk a load event-re
              frame.addEventListener('load', () => {
                setTimeout(() => processFrame(frame), 100);
              }, { once: true });
              // Fallback timeout, ha a load event nem jön el
              setTimeout(() => processFrame(frame), 1000);
            }
          });
        }

        isProcessing = false;
      }, 50); // 50ms debounce (növelve 10ms-ról)
    });

    // Observer indítása - bővített beállításokkal
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });

    debugLog('Searchable Select: MutationObserver elindítva (select + frame/iframe figyelés)');
  }

  // Frame és Iframe-ek kezelése
  const processedFrames = new WeakSet();

  async function processFrame(frame) {
    // Ellenőrizzük, hogy már feldolgoztuk-e
    if (processedFrames.has(frame)) {
      return;
    }

    const frameType = frame.tagName.toLowerCase();

    try {
      // Megpróbáljuk elérni a frame dokumentumát
      const frameDoc = frame.contentDocument || frame.contentWindow?.document;

      if (!frameDoc) {
        debugLog('Searchable Select: ' + frameType + ' dokumentum nem elérhető (CORS?)');
        return;
      }

      // SECURITY: Validáljuk a frame origint cross-origin script injection ellen
      try {
        const frameOrigin = frameDoc.location.origin;
        const currentOrigin = window.location.origin;

        // Csak azonos origin frame-eket dolgozzunk fel (biztonsági okokból)
        if (frameOrigin !== currentOrigin && frameOrigin !== 'null') {
          debugLog('Searchable Select: Cross-origin frame kihagyva (biztonsági okokból):', frameOrigin);
          return;
        }
      } catch (e) {
        // Ha nem tudjuk ellenőrizni az origint, ne dolgozzuk fel
        debugLog('Searchable Select: Frame origin ellenőrzés sikertelen, kihagyva');
        return;
      }

      const frameName = frame.name || frame.src || frame.id || 'névtelen';
      const frameWindow = frame.contentWindow;
      debugLog('Searchable Select: ' + frameType + ' feldolgozása:', frameName);

      // Jelöljük meg hogy feldolgoztuk
      processedFrames.add(frame);

      // Csak CSS injektálása az iframe-be, a parent window Choices osztályát használjuk
      // MEGJEGYZÉS: Ez a megközelítés nem működik tökéletesen cross-document esetben.
      // Az iframe-ben lévő select elemek konvertálódnak, DE a Choices.js event listener-jei
      // (click, focus, stb.) nem működnek megfelelően, mert a parent window context-jéből
      // nem tudják kezelni az iframe document eseményeit.
      // Ez különösen problémás strict Content Security Policy (CSP) esetén, ahol nem lehet
      // script-et injektálni az iframe-be (pl. W3Schools Tryit Editor).
      // A legtöbb weboldalon nincs ilyen szigorú CSP, így ott működni fog.
      debugLog('Searchable Select: CSS injektálása a ' + frameType + '-be...');

      // Choices CSS injektálása
      const choicesCssUrl = chrome.runtime.getURL('choices.min.css');
      const customCssUrl = chrome.runtime.getURL('custom-styles.css');

      const cssLink1 = frameDoc.createElement('link');
      cssLink1.rel = 'stylesheet';
      cssLink1.href = choicesCssUrl;
      frameDoc.head.appendChild(cssLink1);

      const cssLink2 = frameDoc.createElement('link');
      cssLink2.rel = 'stylesheet';
      cssLink2.href = customCssUrl;
      frameDoc.head.appendChild(cssLink2);

      debugLog('Searchable Select: CSS injektálva, parent window Choices használata');

      // Select elemek konvertálása a frame-ben a parent window Choices osztályával
      const frameSelects = frameDoc.querySelectorAll('select:not(.choices__input):not(.choices__input--cloned)');
      debugLog('Searchable Select: ' + frameType + '-ben talált select elemek:', frameSelects.length);

      let convertedInFrame = 0;

      // Feldolgozzuk az iframe select elemeket (async miatt Promise.all)
      const conversionPromises = Array.from(frameSelects).map(async select => {
        try {
          // Parent window Choices osztályát használjuk (CSP miatt nem tudjuk az iframe-be injektálni)
          const ChoicesClass = window.Choices;
          debugLog('Searchable Select: Parent Choices létezik?', !!ChoicesClass);
          debugLog('Searchable Select: frameDoc.body létezik?', !!frameDoc.body);
          debugLog('Searchable Select: select a body-ban van?', frameDoc.body ? frameDoc.body.contains(select) : false);
          debugLog('Searchable Select: már konvertálva?', convertedSelects.has(select));

          if (ChoicesClass && frameDoc.body && frameDoc.body.contains(select) && !convertedSelects.has(select)) {
            debugLog('Searchable Select: Choices példány létrehozása iframe select-re...');

            // Fordítások betöltése
            const lang = settings.language || 'hu';
            const searchPlaceholder = await getLocalizedMessage('searchPlaceholder', lang);
            const noResults = await getLocalizedMessage('noResults', lang);
            const noChoices = await getLocalizedMessage('noChoices', lang);
            const loading = await getLocalizedMessage('loading', lang);

            const choices = new ChoicesClass(select, {
              searchEnabled: true,
              searchPlaceholderValue: searchPlaceholder,
              searchResultLimit: Infinity,
              itemSelectText: '',
              noResultsText: noResults,
              noChoicesText: noChoices,
              loadingText: loading,
              removeItemButton: false,
              shouldSort: false,
              position: 'auto',
              allowHTML: false
            });
            convertedSelects.add(select);
            convertedInFrame++;
            debugLog('Searchable Select: iframe select konvertálva', select);
          } else {
            debugLog('Searchable Select: Konverzió kihagyva - valamelyik feltétel nem teljesült');
          }
        } catch (error) {
          console.error('Searchable Select: Hiba az iframe select konvertálása során:', error);
        }
      });

      await Promise.all(conversionPromises);

      debugLog('Searchable Select: ' + frameType + '-ben konvertálva:', convertedInFrame);

      // Rekurzívan feldolgozzuk a frame-en belüli frame-eket és iframe-eket is
      const nestedFrames = frameDoc.querySelectorAll('frame, iframe');
      if (nestedFrames.length > 0) {
        debugLog('Searchable Select: Nested frames/iframes találva (' + frameType + '-ben):', nestedFrames.length);
        nestedFrames.forEach(nestedFrame => {
          setTimeout(() => processFrame(nestedFrame), 100);
        });
      }

      // MutationObserver a frame-hez is
      const frameObserver = new MutationObserver(mutations => {
        const selectsToConvert = new Set();
        const framesToProcess = new Set();

        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === 'SELECT') {
                selectsToConvert.add(node);
              } else if (node.tagName === 'IFRAME' || node.tagName === 'FRAME') {
                framesToProcess.add(node);
              } else if (node.querySelectorAll) {
                const selects = node.querySelectorAll('select:not(.choices__input):not(.choices__input--cloned)');
                selects.forEach(select => selectsToConvert.add(select));

                const frames = node.querySelectorAll('frame, iframe');
                frames.forEach(f => framesToProcess.add(f));
              }
            }
          });
        });

        if (selectsToConvert.size > 0) {
          debugLog('Searchable Select: ' + frameType + '-ben ' + selectsToConvert.size + ' új select elem észlelve');
          selectsToConvert.forEach(select => convertSelectDelayed(select));
        }

        if (framesToProcess.size > 0) {
          debugLog('Searchable Select: ' + frameType + '-ben ' + framesToProcess.size + ' új frame/iframe észlelve');
          framesToProcess.forEach(f => {
            setTimeout(() => processFrame(f), 100);
          });
        }
      });

      if (frameDoc.body) {
        frameObserver.observe(frameDoc.body, {
          childList: true,
          subtree: true,
          attributes: false
        });
        debugLog('Searchable Select: ' + frameType + ' MutationObserver elindítva');
      }

      // JSF/RichFaces AJAX kompatibilitás a frame-ben is
      // frameWindow már deklarálva van fentebb (277. sor)
      if (frameWindow) {
        // RichFaces AJAX események
        if (frameWindow.Richfaces || frameWindow.RichFaces) {
          try {
            frameDoc.addEventListener('ajaxcomplete', function() {
              debugLog('Searchable Select: RichFaces AJAX complete (' + frameType + ')');
              setTimeout(function() {
                const selects = frameDoc.querySelectorAll('select:not(.choices__input):not(.choices__input--cloned)');
                selects.forEach(select => {
                  if (!convertedSelects.has(select)) {
                    convertSelect(select);
                  }
                });
              }, 100);
            });
            debugLog('Searchable Select: RichFaces AJAX listener hozzáadva (' + frameType + ')');
          } catch (e) {
            debugLog('Searchable Select: RichFaces setup hiba:', e.message);
          }
        }

        // JSF AJAX hook a frame-ben
        if (frameWindow.jsf && frameWindow.jsf.ajax) {
          try {
            const originalRequest = frameWindow.jsf.ajax.request;
            frameWindow.jsf.ajax.request = function() {
              const result = originalRequest.apply(this, arguments);
              setTimeout(function() {
                debugLog('Searchable Select: JSF AJAX complete (' + frameType + ')');
                const selects = frameDoc.querySelectorAll('select:not(.choices__input):not(.choices__input--cloned)');
                selects.forEach(select => {
                  if (!convertedSelects.has(select)) {
                    convertSelect(select);
                  }
                });
              }, 100);
              setTimeout(function() {
                const selects = frameDoc.querySelectorAll('select:not(.choices__input):not(.choices__input--cloned)');
                selects.forEach(select => {
                  if (!convertedSelects.has(select)) {
                    convertSelect(select);
                  }
                });
              }, 300);
              return result;
            };
            debugLog('Searchable Select: JSF AJAX hook telepítve (' + frameType + ')');
          } catch (e) {
            debugLog('Searchable Select: JSF setup hiba:', e.message);
          }
        }

        // XHR hook a frame-ben
        const frameXHR = frameWindow.XMLHttpRequest;
        if (frameXHR) {
          try {
            const origOpen = frameXHR.prototype.open;
            const origSend = frameXHR.prototype.send;

            frameXHR.prototype.open = function(method, url) {
              this._frameUrl = url;
              return origOpen.apply(this, arguments);
            };

            frameXHR.prototype.send = function() {
              const xhr = this;
              xhr.addEventListener('load', function() {
                if (xhr.status >= 200 && xhr.status < 400) {
                  debugLog('Searchable Select: XHR complete (' + frameType + '):', xhr._frameUrl);
                  setTimeout(function() {
                    const selects = frameDoc.querySelectorAll('select:not(.choices__input):not(.choices__input--cloned)');
                    let newCount = 0;
                    selects.forEach(select => {
                      if (!convertedSelects.has(select)) {
                        convertSelect(select);
                        newCount++;
                      }
                    });
                    if (newCount > 0) {
                      debugLog('Searchable Select: XHR után konvertálva:', newCount);
                    }
                  }, 100);
                  setTimeout(function() {
                    const selects = frameDoc.querySelectorAll('select:not(.choices__input):not(.choices__input--cloned)');
                    selects.forEach(select => {
                      if (!convertedSelects.has(select)) {
                        convertSelect(select);
                      }
                    });
                  }, 500);
                }
              });
              return origSend.apply(this, arguments);
            };
            debugLog('Searchable Select: XHR hook telepítve (' + frameType + ')');
          } catch (e) {
            debugLog('Searchable Select: XHR setup hiba:', e.message);
          }
        }
      }

    } catch (error) {
      debugLog('Searchable Select: ' + frameType + ' feldolgozási hiba (valószínűleg CORS):', error.message);
    }
  }

  function processAllFrames() {
    // Frame elemek (frameset)
    const frames = document.querySelectorAll('frame');
    debugLog('Searchable Select: Talált frame elemek:', frames.length);

    frames.forEach(frame => {
      // Azonnali feldolgozás
      if (frame.contentDocument || frame.contentWindow) {
        processFrame(frame);

        // Késleltetett újraellenőrzés - ha később töltődnek be a select-ek
        setTimeout(() => {
          try {
            const frameDoc = frame.contentDocument || frame.contentWindow?.document;
            const frameWindow = frame.contentWindow;
            if (frameDoc && frameWindow) {
              const selects = frameDoc.querySelectorAll('select:not(.choices__input):not(.choices__input--cloned)');
              if (selects.length > 0) {
                debugLog('Searchable Select: Késleltetett ellenőrzés - iframe-ben talált select elemek:', selects.length);
                debugLog('Searchable Select: Késleltetett - frameWindow típusa:', typeof frameWindow);
                let newCount = 0;
                let ChoicesClass = null;

                try {
                  ChoicesClass = frameWindow.Choices;
                  debugLog('Searchable Select: Késleltetett - Choices típusa:', typeof ChoicesClass);
                } catch (accessError) {
                  debugLog('Searchable Select: Késleltetett - Choices hozzáférési hiba:', accessError.message);
                }

                if (ChoicesClass) {
                  debugLog('Searchable Select: Késleltetett - Choices elérhető, konverzió indul');
                  selects.forEach(select => {
                    debugLog('Searchable Select: Késleltetett - select feldolgozása');
                    if (!convertedSelects.has(select) && frameDoc.body && frameDoc.body.contains(select)) {
                      debugLog('Searchable Select: Késleltetett - feltételek teljesültek, Choices példány létrehozása');
                      try {
                        const choices = new ChoicesClass(select, {
                          searchEnabled: true,
                          searchPlaceholderValue: 'Keresés...',
                          searchResultLimit: Infinity,
                          itemSelectText: '',
                          noResultsText: 'Nincs találat',
                          noChoicesText: 'Nincs választható opció',
                          loadingText: 'Betöltés...',
                          removeItemButton: false,
                          shouldSort: false,
                          position: 'auto',
                          allowHTML: false
                        });
                        convertedSelects.add(select);
                        newCount++;
                        debugLog('Searchable Select: Késleltetett konverzió sikeres!', select);
                      } catch (error) {
                        console.error('Searchable Select: Késleltetett konverzió hiba:', error);
                      }
                    } else {
                      debugLog('Searchable Select: Késleltetett - feltételek NEM teljesültek. Már konvertálva?', convertedSelects.has(select), 'Body contains?', frameDoc.body && frameDoc.body.contains(select));
                    }
                  });
                  if (newCount > 0) {
                    debugLog('Searchable Select: Késleltetett konverzió összesen:', newCount);
                  }
                } else {
                  debugLog('Searchable Select: Késleltetett - Choices NEM elérhető!');
                }
              }
            }
          } catch (e) {
            debugLog('Searchable Select: Késleltetett ellenőrzés hiba:', e.message);
          }
        }, 2000); // 2 másodperc késleltetés
      } else {
        frame.addEventListener('load', function() {
          processFrame(frame);
        });
      }
    });

    // Iframe elemek
    const iframes = document.querySelectorAll('iframe');
    debugLog('Searchable Select: Talált iframe elemek:', iframes.length);

    iframes.forEach(iframe => {
      // Azonnali feldolgozás
      if (iframe.contentDocument || iframe.contentWindow) {
        processFrame(iframe);

        // Késleltetett újraellenőrzés
        setTimeout(() => {
          try {
            const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (frameDoc) {
              const selects = frameDoc.querySelectorAll('select:not(.choices__input):not(.choices__input--cloned)');
              if (selects.length > 0) {
                debugLog('Searchable Select: Késleltetett ellenőrzés - iframe-ben talált select elemek:', selects.length);
                let newCount = 0;
                selects.forEach(select => {
                  if (!convertedSelects.has(select)) {
                    convertSelect(select);
                    newCount++;
                  }
                });
                if (newCount > 0) {
                  debugLog('Searchable Select: Késleltetett konverzió:', newCount);
                }
              }
            }
          } catch (e) {
            debugLog('Searchable Select: Késleltetett ellenőrzés hiba:', e.message);
          }
        }, 2000); // 2 másodperc késleltetés
      } else {
        iframe.addEventListener('load', function() {
          processFrame(iframe);
        });
      }
    });
  }

  // Inicializálás
  function init() {
    // Ellenőrizzük, hogy az aktuális domain engedélyezett-e
    if (!isCurrentDomainAllowed()) {
      debugLog('Searchable Select: Ez a domain nincs engedélyezve:', window.location.hostname);
      return;
    }

    debugLog('Searchable Select: Domain engedélyezve, select elemek konvertálása...');

    // Konvertáljuk a meglévő select elemeket
    convertAllSelects();

    // Feldolgozzuk az összes frame-et és iframe-et
    processAllFrames();

    // Indítsuk el az observert
    initObserver();
  }

  // Beállítások frissítése üzenet érkezésekor
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.action === 'settingsUpdated') {
        debugLog('Searchable Select: Beállítások frissítve', request.settings);
        settings = request.settings;
      } else if (request.action === 'languageChanged') {
        debugLog('Searchable Select: Nyelv megváltozott', request.language);
        settings.language = request.language;
        // Az oldal újratöltése szükséges a már konvertált elemek újra-konvertálásához az új nyelvvel
        getLocalizedMessage('languageChangedReload', request.language).then(msg => {
          if (confirm(msg)) {
            location.reload();
          }
        });
        return;
      }

      if (request.action === 'settingsUpdated') {

        // Ha az aktuális domain már nincs engedélyezve, újratöltjük az oldalt
        if (!isCurrentDomainAllowed()) {
          debugLog('Searchable Select: Domain már nincs engedélyezve, oldal újratöltése ajánlott');
          if (confirm('A Searchable Select beállításai megváltoztak. Szeretnéd újratölteni az oldalt?')) {
            window.location.reload();
          }
        } else {
          // Ha engedélyezve van, inicializáljuk újra
          init();
        }
      }
    });
  }

  // JSF (JavaServer Faces) AJAX kompatibilitás
  function setupJSFCompatibility() {
    // JSF AJAX események figyelése
    if (typeof jsf !== 'undefined' && jsf.ajax) {
      // JSF AJAX success event
      const originalJsfRequest = jsf.ajax.request;
      jsf.ajax.request = function() {
        const result = originalJsfRequest.apply(this, arguments);

        // AJAX kérés befejezése után
        setTimeout(function() {
          debugLog('Searchable Select: JSF AJAX befejezve, select-ek újrakonvertálása');
          convertAllSelects();
        }, 100);

        setTimeout(convertAllSelects, 300);
        setTimeout(convertAllSelects, 600);

        return result;
      };
      debugLog('Searchable Select: JSF AJAX kompatibilitás beállítva');
    }

    // RichFaces kompatibilitás
    if (typeof Richfaces !== 'undefined' || typeof RichFaces !== 'undefined') {
      document.addEventListener('ajaxcomplete', function() {
        debugLog('Searchable Select: RichFaces AJAX befejezve');
        setTimeout(convertAllSelects, 100);
        setTimeout(convertAllSelects, 300);
      });
      debugLog('Searchable Select: RichFaces kompatibilitás beállítva');
    }

    // PrimeFaces kompatibilitás
    if (typeof PrimeFaces !== 'undefined') {
      if (PrimeFaces.ajax && PrimeFaces.ajax.Queue) {
        const originalSend = PrimeFaces.ajax.Queue.prototype.send;
        PrimeFaces.ajax.Queue.prototype.send = function() {
          const result = originalSend.apply(this, arguments);
          setTimeout(function() {
            debugLog('Searchable Select: PrimeFaces AJAX befejezve');
            convertAllSelects();
          }, 100);
          return result;
        };
        debugLog('Searchable Select: PrimeFaces kompatibilitás beállítva');
      }
    }

    // Általános AJAX események (jQuery AJAX)
    if (typeof jQuery !== 'undefined') {
      jQuery(document).ajaxComplete(function() {
        debugLog('Searchable Select: jQuery AJAX befejezve');
        setTimeout(convertAllSelects, 100);
        setTimeout(convertAllSelects, 300);
      });
      debugLog('Searchable Select: jQuery AJAX kompatibilitás beállítva');
    }

    // XMLHttpRequest globális figyelés - optimalizált verzió
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    let lastXHRProcessTime = 0;
    const XHR_PROCESS_COOLDOWN = 200; // ms

    XMLHttpRequest.prototype.open = function(method, url) {
      this._method = method;
      this._url = url;
      debugLog('Searchable Select: XHR open:', method, url);
      return originalXHROpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(data) {
      const xhr = this;
      const url = xhr._url || '';

      debugLog('Searchable Select: XHR send:', url);

      // Load esemény
      xhr.addEventListener('load', function() {
        debugLog('Searchable Select: XHR load befejezve:', url, 'status:', xhr.status);

        // Bármilyen sikeres AJAX kérés után
        if (xhr.status >= 200 && xhr.status < 400) {
          const now = Date.now();

          // Cooldown ellenőrzés - ne dolgozzunk fel túl gyakran
          if (now - lastXHRProcessTime < XHR_PROCESS_COOLDOWN) {
            debugLog('Searchable Select: XHR cooldown aktív, kihagyás');
            return;
          }

          lastXHRProcessTime = now;
          debugLog('Searchable Select: Sikeres AJAX, select-ek újrakonvertálása');

          // Egyetlen delayed check elegendő - a MutationObserver kezeli a többit
          setTimeout(function() {
            debugLog('Searchable Select: 150ms késleltetés után konvertálás');
            convertAllSelects();
          }, 150);
        }
      });

      // ReadyStateChange is figyeljük
      xhr.addEventListener('readystatechange', function() {
        if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 400) {
          debugLog('Searchable Select: ReadyState 4 (befejezve)');
        }
      });

      return originalXHRSend.apply(this, arguments);
    };

    debugLog('Searchable Select: XMLHttpRequest figyelés beállítva');
  }

  // Beállítások betöltése és inicializálás
  loadSettings(function() {
    // Kezdeti indítás
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        init();
        setupJSFCompatibility();
      });
    } else {
      init();
      setupJSFCompatibility();
    }

    // Ha a body még nem létezik, várunk rá
    if (!document.body) {
      const bodyObserver = new MutationObserver(() => {
        if (document.body) {
          bodyObserver.disconnect();
          init();
          setupJSFCompatibility();
        }
      });
      bodyObserver.observe(document.documentElement, { childList: true });
    }
  });

  debugLog('Searchable Select: Bővítmény betöltve');
})();
