(function() {
  'use strict';

  // Már konvertált select elemek tárolása
  const convertedSelects = new WeakSet();

  // Szélesség cache ID alapján (AJAX után is megmarad)
  const widthCache = new Map();

  // Beállítások
  let settings = {
    enableAllDomains: true,
    allowedDomains: [],
    enableDebugLogs: false,
    language: 'hu', // Alapértelmezett nyelv
    primaryColor: '#4a90d9', // Alapértelmezett szín
    widthMode: 'original' // 'auto' vagy 'original'
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
        language: chrome.i18n.getUILanguage().split('-')[0],
        primaryColor: '#4a90d9',
        widthMode: 'original'
      }, function(items) {
        settings = items;
        debugLog('Searchable Select: Beállítások betöltve', settings);
        applyCustomColor(settings.primaryColor);
        applyWidthMode(settings.widthMode);
        if (callback) callback();
      });
    } else {
      // Ha nincs elérhető a storage API (pl. lokális tesztelés)
      if (callback) callback();
    }
  }

  // Szín alkalmazása dinamikusan
  function applyCustomColor(color) {
    const styleId = 'searchable-select-custom-color';
    let styleEl = document.getElementById(styleId);

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    // Hover szín számítása (világosabb verzió)
    const hoverColor = lightenColor(color, 0.85);

    styleEl.textContent = `
      .ss-content .ss-list .ss-option.ss-selected {
        background-color: ${color} !important;
        color: #fff !important;
      }
      .ss-content .ss-list .ss-option:hover:not(.ss-disabled),
      .ss-content .ss-list .ss-option.ss-highlighted {
        background-color: ${hoverColor} !important;
        color: #333 !important;
      }
      .ss-content .ss-search input:focus {
        border-color: ${color} !important;
        box-shadow: 0 0 0 1px ${color}33 !important;
      }
    `;

    debugLog('Searchable Select: Egyedi szín alkalmazva:', color);
  }

  // Szín világosítása
  function lightenColor(hex, factor) {
    // Hex to RGB
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // Lighten
    const newR = Math.round(r + (255 - r) * factor);
    const newG = Math.round(g + (255 - g) * factor);
    const newB = Math.round(b + (255 - b) * factor);

    // RGB to Hex
    return '#' + [newR, newG, newB].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  // Szélesség mód alkalmazása - globális stílusok helyett most már egyedileg kezeljük
  function applyWidthMode(mode) {
    // Globális stílust töröljük, ha volt
    const styleId = 'searchable-select-width-mode';
    let styleEl = document.getElementById(styleId);
    if (styleEl) {
      styleEl.remove();
    }

    debugLog('Searchable Select: Szélesség mód:', mode);
  }

  // Select elem elrejtése (AJAX után is működjön)
  const hiddenSelectStyle = 'position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;opacity:0!important;pointer-events:none!important;visibility:hidden!important;';

  // WeakSet a már megfigyelt select elemekhez
  const observedSelects = new WeakSet();

  function hideSelectElement(selectElement) {
    selectElement.style.cssText = hiddenSelectStyle;

    // Csak egyszer adjunk hozzá observer-t
    if (observedSelects.has(selectElement)) {
      return;
    }
    observedSelects.add(selectElement);

    // MutationObserver ami újra elrejti ha valami visszaállítaná a stílust
    let isUpdating = false;
    const styleObserver = new MutationObserver((mutations) => {
      if (isUpdating) return;

      const currentStyle = selectElement.getAttribute('style') || '';
      if (!currentStyle.includes('visibility:hidden')) {
        isUpdating = true;
        selectElement.style.cssText = hiddenSelectStyle;
        debugLog('Searchable Select: Select stílus visszaállítva elrejtettre');
        // Kis késleltetés után engedélyezzük újra
        setTimeout(() => { isUpdating = false; }, 50);
      }
    });

    styleObserver.observe(selectElement, { attributes: true, attributeFilter: ['style'] });
  }

  // Eredeti select szélesség lekérdezése
  function getSelectWidth(selectElement) {
    // Computed style lekérése
    const computedStyle = window.getComputedStyle(selectElement);
    const computedWidth = parseFloat(computedStyle.width);

    // Ha van explicit width beállítva és érvényes
    if (computedWidth && computedWidth > 0) {
      return computedWidth + 'px';
    }

    // Inline style ellenőrzése
    if (selectElement.style.width) {
      return selectElement.style.width;
    }

    // Attribute ellenőrzése
    const widthAttr = selectElement.getAttribute('width');
    if (widthAttr) {
      return widthAttr.includes('%') || widthAttr.includes('px') ? widthAttr : widthAttr + 'px';
    }

    return null;
  }

  // Select elem konvertálása SlimSelect-re
  async function convertSelect(selectElement) {
    // Ellenőrizzük, hogy már konvertálva lett-e
    if (convertedSelects.has(selectElement)) {
      return;
    }

    // Ellenőrizzük, hogy van-e már SlimSelect instance rajta
    if (selectElement.classList.contains('ss-main') || selectElement.dataset.ssid) {
      return;
    }

    // Ellenőrizzük, hogy a select parent létezik-e a DOM-ban
    if (!document.body.contains(selectElement)) {
      return;
    }

    try {
      // Eredeti szélesség lekérése MIELŐTT a SlimSelect felülírná
      // Ha van ID, használjuk a cache-t (AJAX után is megmarad)
      const selectId = selectElement.id || selectElement.name;
      let originalWidth = null;

      if (selectId && widthCache.has(selectId)) {
        // Cache-ből vesszük
        originalWidth = widthCache.get(selectId);
        debugLog('Searchable Select: Szélesség cache-ből:', selectId, originalWidth);
      } else {
        // Kiszámoljuk és cache-eljük
        originalWidth = getSelectWidth(selectElement);
        if (selectId && originalWidth) {
          widthCache.set(selectId, originalWidth);
        }
        debugLog('Searchable Select: Eredeti szélesség:', originalWidth);
      }

      // Fordítások betöltése
      const lang = settings.language || 'hu';
      const searchPlaceholder = await getLocalizedMessage('searchPlaceholder', lang);
      const noResults = await getLocalizedMessage('noResults', lang);

      // SlimSelect inicializálása keresés támogatással
      const slim = new SlimSelect({
        select: selectElement,
        settings: {
          showSearch: true,
          focusSearch: true,
          searchPlaceholder: searchPlaceholder,
          searchText: noResults,
          searchHighlight: true,
          closeOnSelect: true,
          allowDeselect: false,
          openPosition: 'auto',
          placeholderText: ''
        }
      });

      // Szélesség alkalmazása a beállítások alapján
      // A SlimSelect a select.slim.render.main-ben tárolja a főelemet
      const ssMain = slim.render.main.main;
      debugLog('Searchable Select: ssMain elem:', ssMain, 'widthMode:', settings.widthMode, 'originalWidth:', originalWidth);

      if (ssMain) {
        // Eredeti szélességet eltároljuk a data attribútumban
        if (originalWidth) {
          ssMain.dataset.originalWidth = originalWidth;
        }

        // Szélesség alkalmazása függvény
        const applyWidth = () => {
          if (settings.widthMode === 'original' && originalWidth) {
            ssMain.style.setProperty('width', originalWidth, 'important');
            ssMain.style.setProperty('min-width', '0', 'important');
          } else {
            ssMain.style.setProperty('width', 'auto', 'important');
            ssMain.style.setProperty('min-width', '50px', 'important');
          }
        };

        // Alkalmazzuk azonnal
        applyWidth();
        debugLog('Searchable Select: Eredeti szélesség alkalmazva:', originalWidth);

        // És késleltetve is, ha valami felülírná
        setTimeout(applyWidth, 50);
        setTimeout(applyWidth, 150);
        setTimeout(applyWidth, 300);
      }

      // Az eredeti select elem elrejtése JavaScript-ből is (CSS backup)
      hideSelectElement(selectElement);

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

  // Árva SlimSelect elemek eltávolítása (AJAX után maradhatnak)
  function cleanupOrphanedSlimSelects() {
    // Keressük azokat a .ss-main elemeket, amiknek nincs megfelelő select párja
    const ssMainElements = document.querySelectorAll('.ss-main');
    let removedCount = 0;

    ssMainElements.forEach(ssMain => {
      // A SlimSelect a select elé szúrja be magát, szóval a previousElementSibling vagy
      // az ugyanabban a containerben lévő select[data-ssid] a párja
      const ssId = ssMain.dataset.id;
      if (ssId) {
        const linkedSelect = document.querySelector(`select[data-ssid="${ssId}"]`);
        if (!linkedSelect || !document.body.contains(linkedSelect)) {
          // Nincs párja vagy nincs a DOM-ban - töröljük
          ssMain.remove();
          removedCount++;
        }
      }
    });

    if (removedCount > 0) {
      debugLog('Searchable Select: Árva SlimSelect elemek eltávolítva:', removedCount);
    }
  }

  // Meglévő SlimSelect elemek szélességének frissítése
  function updateSlimSelectWidths() {
    const ssMainElements = document.querySelectorAll('.ss-main');

    ssMainElements.forEach(ssMain => {
      const ssId = ssMain.dataset.id;
      if (ssId) {
        const linkedSelect = document.querySelector(`select[data-ssid="${ssId}"]`);
        if (linkedSelect && document.body.contains(linkedSelect)) {
          // Szélesség frissítése a beállítások alapján
          if (settings.widthMode === 'original') {
            // Használjuk a tárolt eredeti szélességet
            const storedWidth = ssMain.dataset.originalWidth;
            if (storedWidth) {
              ssMain.style.width = storedWidth;
              ssMain.style.minWidth = '0';
            }
          } else {
            ssMain.style.width = 'auto';
            ssMain.style.minWidth = '50px';
          }
        }
      }
    });
  }

  // Összes select elem konvertálása az oldalon
  function convertAllSelects() {
    // Először takarítsuk el az árva elemeket
    cleanupOrphanedSlimSelects();

    // Frissítsük a meglévő SlimSelect-ek szélességét
    updateSlimSelectWidths();

    const selects = document.querySelectorAll('select:not([data-ssid])');
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
              else if (node.tagName === 'SELECT' && !node.dataset.ssid) {
                selectsToConvert.add(node);
              }
              // Ha az elem tartalmaz select elemeket vagy frame-eket
              else if (node.querySelectorAll) {
                // Select elemek keresése
                const selects = node.querySelectorAll('select:not([data-ssid])');
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
      }, 50); // 50ms debounce
    });

    // Observer indítása
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

        // Csak azonos origin frame-eket dolgozzunk fel
        if (frameOrigin !== currentOrigin && frameOrigin !== 'null') {
          debugLog('Searchable Select: Cross-origin frame kihagyva:', frameOrigin);
          return;
        }
      } catch (e) {
        debugLog('Searchable Select: Frame origin ellenőrzés sikertelen, kihagyva');
        return;
      }

      const frameName = frame.name || frame.src || frame.id || 'névtelen';
      const frameWindow = frame.contentWindow;
      debugLog('Searchable Select: ' + frameType + ' feldolgozása:', frameName);

      // Jelöljük meg hogy feldolgoztuk
      processedFrames.add(frame);

      // CSS injektálása az iframe-be
      debugLog('Searchable Select: CSS injektálása a ' + frameType + '-be...');

      const slimCssUrl = chrome.runtime.getURL('slimselect.min.css');
      const customCssUrl = chrome.runtime.getURL('custom-styles.css');

      const cssLink1 = frameDoc.createElement('link');
      cssLink1.rel = 'stylesheet';
      cssLink1.href = slimCssUrl;
      frameDoc.head.appendChild(cssLink1);

      const cssLink2 = frameDoc.createElement('link');
      cssLink2.rel = 'stylesheet';
      cssLink2.href = customCssUrl;
      frameDoc.head.appendChild(cssLink2);

      debugLog('Searchable Select: CSS injektálva');

      // Select elemek konvertálása a frame-ben
      const frameSelects = frameDoc.querySelectorAll('select:not([data-ssid])');
      debugLog('Searchable Select: ' + frameType + '-ben talált select elemek:', frameSelects.length);

      let convertedInFrame = 0;

      // Feldolgozzuk az iframe select elemeket
      const conversionPromises = Array.from(frameSelects).map(async select => {
        try {
          const SlimSelectClass = window.SlimSelect;

          if (SlimSelectClass && frameDoc.body && frameDoc.body.contains(select) && !convertedSelects.has(select)) {
            // Eredeti szélesség lekérése - cache használatával
            const selectId = select.id || select.name;
            let originalWidth = null;

            if (selectId && widthCache.has(selectId)) {
              originalWidth = widthCache.get(selectId);
            } else {
              originalWidth = getSelectWidth(select);
              if (selectId && originalWidth) {
                widthCache.set(selectId, originalWidth);
              }
            }

            const lang = settings.language || 'hu';
            const searchPlaceholder = await getLocalizedMessage('searchPlaceholder', lang);
            const noResults = await getLocalizedMessage('noResults', lang);

            const slim = new SlimSelectClass({
              select: select,
              settings: {
                showSearch: true,
                focusSearch: true,
                searchPlaceholder: searchPlaceholder,
                searchText: noResults,
                searchHighlight: true,
                closeOnSelect: true,
                allowDeselect: false,
                openPosition: 'auto',
                placeholderText: ''
              }
            });

            // Szélesség alkalmazása a beállítások alapján
            const ssMain = slim.render.main.main;
            if (ssMain) {
              // Eredeti szélességet eltároljuk a data attribútumban
              if (originalWidth) {
                ssMain.dataset.originalWidth = originalWidth;
              }

              if (settings.widthMode === 'original' && originalWidth) {
                ssMain.style.width = originalWidth;
                ssMain.style.minWidth = '0';
              } else {
                ssMain.style.width = 'auto';
                ssMain.style.minWidth = '50px';
              }
            }

            // Az eredeti select elem elrejtése JavaScript-ből is
            hideSelectElement(select);

            convertedSelects.add(select);
            convertedInFrame++;
            debugLog('Searchable Select: iframe select konvertálva', select);
          }
        } catch (error) {
          console.error('Searchable Select: Hiba az iframe select konvertálása során:', error);
        }
      });

      await Promise.all(conversionPromises);

      debugLog('Searchable Select: ' + frameType + '-ben konvertálva:', convertedInFrame);

      // Rekurzívan feldolgozzuk a frame-en belüli frame-eket
      const nestedFrames = frameDoc.querySelectorAll('frame, iframe');
      if (nestedFrames.length > 0) {
        debugLog('Searchable Select: Nested frames találva:', nestedFrames.length);
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
              if (node.tagName === 'SELECT' && !node.dataset.ssid) {
                selectsToConvert.add(node);
              } else if (node.tagName === 'IFRAME' || node.tagName === 'FRAME') {
                framesToProcess.add(node);
              } else if (node.querySelectorAll) {
                const selects = node.querySelectorAll('select:not([data-ssid])');
                selects.forEach(select => selectsToConvert.add(select));

                const frames = node.querySelectorAll('frame, iframe');
                frames.forEach(f => framesToProcess.add(f));
              }
            }
          });
        });

        if (selectsToConvert.size > 0) {
          debugLog('Searchable Select: ' + frameType + '-ben ' + selectsToConvert.size + ' új select');
          selectsToConvert.forEach(select => convertSelectDelayed(select));
        }

        if (framesToProcess.size > 0) {
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

      // JSF/RichFaces AJAX kompatibilitás a frame-ben
      if (frameWindow) {
        // RichFaces AJAX események
        if (frameWindow.Richfaces || frameWindow.RichFaces) {
          try {
            frameDoc.addEventListener('ajaxcomplete', function() {
              debugLog('Searchable Select: RichFaces AJAX complete (' + frameType + ')');
              setTimeout(function() {
                const selects = frameDoc.querySelectorAll('select:not([data-ssid])');
                selects.forEach(select => {
                  if (!convertedSelects.has(select)) {
                    convertSelect(select);
                  }
                });
              }, 100);
            });
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
                const selects = frameDoc.querySelectorAll('select:not([data-ssid])');
                selects.forEach(select => {
                  if (!convertedSelects.has(select)) {
                    convertSelect(select);
                  }
                });
              }, 100);
              setTimeout(function() {
                const selects = frameDoc.querySelectorAll('select:not([data-ssid])');
                selects.forEach(select => {
                  if (!convertedSelects.has(select)) {
                    convertSelect(select);
                  }
                });
              }, 300);
              return result;
            };
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
                  setTimeout(function() {
                    const selects = frameDoc.querySelectorAll('select:not([data-ssid])');
                    selects.forEach(select => {
                      if (!convertedSelects.has(select)) {
                        convertSelect(select);
                      }
                    });
                  }, 100);
                }
              });
              return origSend.apply(this, arguments);
            };
          } catch (e) {
            debugLog('Searchable Select: XHR setup hiba:', e.message);
          }
        }
      }

    } catch (error) {
      debugLog('Searchable Select: ' + frameType + ' feldolgozási hiba:', error.message);
    }
  }

  function processAllFrames() {
    // Frame elemek (frameset)
    const frames = document.querySelectorAll('frame');
    debugLog('Searchable Select: Talált frame elemek:', frames.length);

    frames.forEach(frame => {
      if (frame.contentDocument || frame.contentWindow) {
        processFrame(frame);
        setTimeout(() => {
          try {
            const frameDoc = frame.contentDocument || frame.contentWindow?.document;
            if (frameDoc) {
              const selects = frameDoc.querySelectorAll('select:not([data-ssid])');
              if (selects.length > 0) {
                selects.forEach(select => {
                  if (!convertedSelects.has(select)) {
                    convertSelect(select);
                  }
                });
              }
            }
          } catch (e) {
            debugLog('Searchable Select: Késleltetett ellenőrzés hiba:', e.message);
          }
        }, 2000);
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
      if (iframe.contentDocument || iframe.contentWindow) {
        processFrame(iframe);
        setTimeout(() => {
          try {
            const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (frameDoc) {
              const selects = frameDoc.querySelectorAll('select:not([data-ssid])');
              if (selects.length > 0) {
                selects.forEach(select => {
                  if (!convertedSelects.has(select)) {
                    convertSelect(select);
                  }
                });
              }
            }
          } catch (e) {
            debugLog('Searchable Select: Késleltetett ellenőrzés hiba:', e.message);
          }
        }, 2000);
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
        // Szín frissítése azonnal
        if (settings.primaryColor) {
          applyCustomColor(settings.primaryColor);
        }
        // Szélesség mód frissítése
        if (settings.widthMode) {
          applyWidthMode(settings.widthMode);
        }
      } else if (request.action === 'languageChanged') {
        debugLog('Searchable Select: Nyelv megváltozott', request.language);
        settings.language = request.language;
        getLocalizedMessage('languageChangedReload', request.language).then(msg => {
          if (confirm(msg)) {
            location.reload();
          }
        });
        return;
      }

      if (request.action === 'settingsUpdated') {
        if (!isCurrentDomainAllowed()) {
          debugLog('Searchable Select: Domain már nincs engedélyezve');
          if (confirm('A Searchable Select beállításai megváltoztak. Szeretnéd újratölteni az oldalt?')) {
            window.location.reload();
          }
        } else {
          init();
        }
      }
    });
  }

  // JSF (JavaServer Faces) AJAX kompatibilitás
  function setupJSFCompatibility() {
    // JSF AJAX események figyelése
    if (typeof jsf !== 'undefined' && jsf.ajax) {
      const originalJsfRequest = jsf.ajax.request;
      jsf.ajax.request = function() {
        const result = originalJsfRequest.apply(this, arguments);

        setTimeout(function() {
          debugLog('Searchable Select: JSF AJAX befejezve');
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

    // jQuery AJAX
    if (typeof jQuery !== 'undefined') {
      jQuery(document).ajaxComplete(function() {
        debugLog('Searchable Select: jQuery AJAX befejezve');
        setTimeout(convertAllSelects, 100);
        setTimeout(convertAllSelects, 300);
      });
      debugLog('Searchable Select: jQuery AJAX kompatibilitás beállítva');
    }

    // XMLHttpRequest globális figyelés
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    let lastXHRProcessTime = 0;
    const XHR_PROCESS_COOLDOWN = 200;

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

      xhr.addEventListener('load', function() {
        debugLog('Searchable Select: XHR load befejezve:', url, 'status:', xhr.status);

        if (xhr.status >= 200 && xhr.status < 400) {
          const now = Date.now();

          if (now - lastXHRProcessTime < XHR_PROCESS_COOLDOWN) {
            debugLog('Searchable Select: XHR cooldown aktív');
            return;
          }

          lastXHRProcessTime = now;
          debugLog('Searchable Select: Sikeres AJAX, select-ek újrakonvertálása');

          setTimeout(function() {
            convertAllSelects();
          }, 150);
        }
      });

      xhr.addEventListener('readystatechange', function() {
        if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 400) {
          debugLog('Searchable Select: ReadyState 4');
        }
      });

      return originalXHRSend.apply(this, arguments);
    };

    debugLog('Searchable Select: XMLHttpRequest figyelés beállítva');
  }

  // Beállítások betöltése és inicializálás
  loadSettings(function() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        init();
        setupJSFCompatibility();
      });
    } else {
      init();
      setupJSFCompatibility();
    }

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
