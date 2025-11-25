// Options page script
document.addEventListener('DOMContentLoaded', function() {
  const enableDebugLogsToggle = document.getElementById('enableDebugLogs');
  const enableAllDomainsToggle = document.getElementById('enableAllDomains');
  const domainListSection = document.getElementById('domainListSection');
  const domainListTextarea = document.getElementById('domainList');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const statusMessage = document.getElementById('statusMessage');
  const warningBox = document.getElementById('warningBox');
  const domainCountSpan = document.getElementById('domainCount');
  const languageSelect = document.getElementById('languageSelect');
  const primaryColorInput = document.getElementById('primaryColor');
  const colorPresets = document.querySelectorAll('.color-preset');
  const widthModeRadios = document.querySelectorAll('input[name="widthMode"]');

  // Betöltjük a nyelvet és fordításokat
  window.i18nManager.getCurrentLanguage(function(lang) {
    languageSelect.value = lang;
    window.i18nManager.applyTranslations(lang).then(() => {
      // Betöltjük a mentett beállításokat a fordítások alkalmazása után
      loadSettings();
    });
  });

  // Nyelv változás figyelése
  languageSelect.addEventListener('change', function() {
    const newLang = languageSelect.value;
    window.i18nManager.setLanguage(newLang, function() {
      window.i18nManager.applyTranslations(newLang).then(() => {
        updateDomainCount(); // Frissítjük a domain számlálót az új nyelvvel

        // Frissítjük az összes megnyitott tabot az új nyelvvel
        chrome.tabs.query({}, function(tabs) {
          tabs.forEach(function(tab) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'languageChanged',
              language: newLang
            }).catch(() => {
              // Néhány tab (pl. chrome://) nem fogadhat üzeneteket, ezt ignoráljuk
            });
          });
        });
      });
    });
  });

  // Toggle változás figyelése
  enableAllDomainsToggle.addEventListener('change', function() {
    updateDomainListVisibility();
    updateWarningBox();
  });

  // Domain lista változás figyelése (domain számláló frissítése)
  domainListTextarea.addEventListener('input', function() {
    updateDomainCount();
  });

  // Szín változás figyelése
  primaryColorInput.addEventListener('input', function() {
    updateColorPresetActive(primaryColorInput.value);
  });

  // Preset színek kattintás
  colorPresets.forEach(function(preset) {
    preset.addEventListener('click', function() {
      const color = preset.dataset.color;
      primaryColorInput.value = color;
      updateColorPresetActive(color);
    });
  });

  // Aktív preset frissítése
  function updateColorPresetActive(selectedColor) {
    colorPresets.forEach(function(preset) {
      if (preset.dataset.color.toLowerCase() === selectedColor.toLowerCase()) {
        preset.classList.add('active');
      } else {
        preset.classList.remove('active');
      }
    });
  }

  // Mentés gomb
  saveBtn.addEventListener('click', saveSettings);

  // Reset gomb
  resetBtn.addEventListener('click', resetSettings);

  // Beállítások betöltése
  function loadSettings() {
    chrome.storage.sync.get({
      enableDebugLogs: false,
      enableAllDomains: true,
      allowedDomains: [],
      primaryColor: '#4a90d9',
      widthMode: 'original'
    }, function(items) {
      enableDebugLogsToggle.checked = items.enableDebugLogs;
      enableAllDomainsToggle.checked = items.enableAllDomains;
      domainListTextarea.value = items.allowedDomains.join('\n');
      primaryColorInput.value = items.primaryColor;
      updateColorPresetActive(items.primaryColor);
      // Width mode beállítása
      widthModeRadios.forEach(function(radio) {
        radio.checked = (radio.value === items.widthMode);
      });
      updateDomainListVisibility();
      updateWarningBox();
      updateDomainCount();
    });
  }

  // Beállítások mentése
  function saveSettings() {
    const enableDebugLogs = enableDebugLogsToggle.checked;
    const enableAllDomains = enableAllDomainsToggle.checked;
    const domainText = domainListTextarea.value;
    const primaryColor = primaryColorInput.value;
    const widthMode = document.querySelector('input[name="widthMode"]:checked').value;

    // Domain lista feldolgozása
    const allowedDomains = domainText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => !line.startsWith('#')); // Megjegyzések kiszűrése

    // Validálás
    if (!enableAllDomains && allowedDomains.length === 0) {
      window.i18nManager.getCurrentLanguage(function(lang) {
        window.i18nManager.getTranslatedMessage('domainRequired', lang).then(msg => {
          showStatus(msg, 'error');
        });
      });
      return;
    }

    // Mentés
    chrome.storage.sync.set({
      enableDebugLogs: enableDebugLogs,
      enableAllDomains: enableAllDomains,
      allowedDomains: allowedDomains,
      primaryColor: primaryColor,
      widthMode: widthMode
    }, function() {
      window.i18nManager.getCurrentLanguage(function(lang) {
        if (chrome.runtime.lastError) {
          window.i18nManager.getTranslatedMessage('saveError', lang, [chrome.runtime.lastError.message]).then(msg => {
            showStatus(msg, 'error');
          });
        } else {
          window.i18nManager.getTranslatedMessage('saveSuccess', lang).then(msg => {
            showStatus(msg, 'success');
          });

          // Frissítjük az összes megnyitott tabot
          chrome.tabs.query({}, function(tabs) {
            window.i18nManager.getCurrentLanguage(function(currentLang) {
              tabs.forEach(function(tab) {
                chrome.tabs.sendMessage(tab.id, {
                  action: 'settingsUpdated',
                  settings: {
                    enableDebugLogs: enableDebugLogs,
                    enableAllDomains: enableAllDomains,
                    allowedDomains: allowedDomains,
                    primaryColor: primaryColor,
                    widthMode: widthMode,
                    language: currentLang
                  }
                }).catch(() => {
                  // Néhány tab (pl. chrome://) nem fogadhat üzeneteket, ezt ignoráljuk
                });
              });
            });
          });
        }
      });
    });
  }

  // Alapértelmezett beállítások visszaállítása
  function resetSettings() {
    window.i18nManager.getCurrentLanguage(function(lang) {
      window.i18nManager.getTranslatedMessage('resetConfirm', lang).then(confirmMsg => {
        if (confirm(confirmMsg)) {
          enableDebugLogsToggle.checked = false;
          enableAllDomainsToggle.checked = true;
          domainListTextarea.value = '';
          primaryColorInput.value = '#4a90d9';
          updateColorPresetActive('#4a90d9');
          // Width mode reset
          widthModeRadios.forEach(function(radio) {
            radio.checked = (radio.value === 'original');
          });
          updateDomainListVisibility();
          updateWarningBox();
          updateDomainCount();
          window.i18nManager.getTranslatedMessage('resetSuccess', lang).then(msg => {
            showStatus(msg, 'success');
          });
        }
      });
    });
  }

  // Domain lista láthatóság frissítése
  function updateDomainListVisibility() {
    const isEnabled = enableAllDomainsToggle.checked;
    domainListTextarea.disabled = isEnabled;

    if (isEnabled) {
      domainListSection.style.opacity = '0.5';
    } else {
      domainListSection.style.opacity = '1';
    }
  }

  // Figyelmeztetés megjelenítése
  function updateWarningBox() {
    if (!enableAllDomainsToggle.checked) {
      warningBox.classList.add('show');
    } else {
      warningBox.classList.remove('show');
    }
  }

  // Domain számláló frissítése
  function updateDomainCount() {
    const domains = domainListTextarea.value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => !line.startsWith('#'));

    const count = domains.length;
    window.i18nManager.getCurrentLanguage(function(lang) {
      window.i18nManager.getTranslatedMessage('domainCount', lang, [count.toString()]).then(msg => {
        domainCountSpan.textContent = msg;
      });
    });
  }

  // Státusz üzenet megjelenítése
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;

    // 3 másodperc után eltüntetjük
    setTimeout(function() {
      statusMessage.className = 'status-message';
    }, 3000);
  }
});
