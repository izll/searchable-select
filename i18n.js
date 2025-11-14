// Internationalization helper
(function() {
  'use strict';

  // Apply translations to all elements with data-i18n attribute
  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const message = chrome.i18n.getMessage(key);

      if (message) {
        if (element.tagName === 'INPUT' && element.type === 'text') {
          element.placeholder = message;
        } else if (element.tagName === 'TEXTAREA') {
          element.placeholder = message;
        } else if (element.tagName === 'OPTION') {
          element.textContent = message;
        } else {
          element.innerHTML = message;
        }
      }
    });

    // Update document title
    const titleKey = document.documentElement.getAttribute('data-i18n-title');
    if (titleKey) {
      const title = chrome.i18n.getMessage(titleKey);
      if (title) {
        document.title = title;
      }
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTranslations);
  } else {
    applyTranslations();
  }
})();
