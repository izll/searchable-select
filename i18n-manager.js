// Language manager for dynamic language switching
(function() {
  'use strict';

  // Get the current language from storage or browser default
  function getCurrentLanguage(callback) {
    chrome.storage.sync.get({
      language: chrome.i18n.getUILanguage().split('-')[0] // Get browser language (e.g., 'hu' from 'hu-HU')
    }, function(items) {
      callback(items.language);
    });
  }

  // Save the language preference
  function setLanguage(lang, callback) {
    chrome.storage.sync.set({ language: lang }, callback);
  }

  // Get translated message based on selected language
  function getTranslatedMessage(key, lang, substitutions) {
    // Since chrome.i18n.getMessage() always uses the browser's language,
    // we need to manually load the messages from the locale files
    const messagePath = chrome.runtime.getURL(`_locales/${lang}/messages.json`);

    return fetch(messagePath)
      .then(response => response.json())
      .then(messages => {
        if (messages[key] && messages[key].message) {
          let message = messages[key].message;

          // Handle placeholders
          if (substitutions) {
            if (!Array.isArray(substitutions)) {
              substitutions = [substitutions];
            }
            substitutions.forEach((sub, index) => {
              message = message.replace(`$${index + 1}`, sub);
              // Also handle named placeholders like $COUNT$
              const placeholderName = messages[key].placeholders ?
                Object.keys(messages[key].placeholders)[index] : null;
              if (placeholderName) {
                message = message.replace(`$${placeholderName.toUpperCase()}$`, sub);
              }
            });
          }

          return message;
        }
        return key; // Return key if translation not found
      })
      .catch(error => {
        console.error('Error loading translation:', error);
        return key;
      });
  }

  // Apply translations based on selected language
  function applyTranslations(lang) {
    const promises = [];

    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const promise = getTranslatedMessage(key, lang).then(message => {
        if (element.tagName === 'INPUT' && element.type === 'text') {
          element.placeholder = message;
        } else if (element.tagName === 'TEXTAREA') {
          element.placeholder = message;
        } else if (element.tagName === 'OPTION') {
          element.textContent = message;
        } else {
          element.innerHTML = message;
        }
      });
      promises.push(promise);
    });

    // Update document title
    const titleKey = document.documentElement.getAttribute('data-i18n-title');
    if (titleKey) {
      promises.push(getTranslatedMessage(titleKey, lang).then(title => {
        document.title = title;
      }));
    }

    return Promise.all(promises);
  }

  // Export functions to window
  window.i18nManager = {
    getCurrentLanguage,
    setLanguage,
    getTranslatedMessage,
    applyTranslations
  };
})();
