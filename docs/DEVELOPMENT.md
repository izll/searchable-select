# Developer Documentation - Searchable Select

This document describes the internal workings of the extension and the development process.

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Chrome Extension                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐     ┌──────────────────┐                │
│  │  manifest.json │────▶│  Content Script  │                │
│  └────────────────┘     │   (content.js)   │                │
│                         └──────────────────┘                │
│                                │                              │
│                                ▼                              │
│                    ┌──────────────────────┐                  │
│                    │  Choices.js Library  │                  │
│                    └──────────────────────┘                  │
│                                                               │
│  ┌────────────────┐     ┌──────────────────┐                │
│  │  options.html  │────▶│   options.js     │                │
│  └────────────────┘     └──────────────────┘                │
│                                │                              │
│                                ▼                              │
│                    ┌──────────────────────┐                  │
│                    │  Chrome Storage API  │                  │
│                    └──────────────────────┘                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Main Process

1. **Initialization** (`document_end`)
   - Load settings from Chrome Storage
   - Domain check
   - Find and convert select elements

2. **DOM Observation** (MutationObserver)
   - Automatic detection of new select elements
   - Debouncing (10ms) for performance optimization
   - Multi-level retry mechanism (50ms, 150ms, 300ms, 500ms)

3. **Frame Handling**
   - Recursive frame processing
   - Dynamic loading of Choices.js into each frame
   - Per-frame MutationObserver

4. **AJAX/JSF Support**
   - JSF AJAX hook (`jsf.ajax.request`)
   - RichFaces event listeners
   - Global XMLHttpRequest monitoring

## Code Structure (content.js)

### 1. Variables and State Management

```javascript
const convertedSelects = new WeakSet(); // Track converted elements
const processedFrames = new WeakSet(); // Processed frames

let settings = {
  enableAllDomains: true,
  allowedDomains: []
};
```

**Why WeakSet?**
- Automatic memory cleanup
- No memory leaks
- Fast lookup (O(1))

### 2. Domain Check

```javascript
function isCurrentDomainAllowed() {
  if (settings.enableAllDomains) return true;

  const currentHostname = window.location.hostname;

  return settings.allowedDomains.some(domain => {
    if (domain.includes('*')) {
      // Wildcard support: *.example.com
      const pattern = domain.replace(/\*/g, '.*').replace(/\./g, '\\.');
      const regex = new RegExp('^' + pattern + '$', 'i');
      return regex.test(currentHostname);
    }

    // Exact match or subdomain
    return currentHostname === domain || currentHostname.endsWith('.' + domain);
  });
}
```

**Supported formats:**
- `example.com` → `example.com`, `sub.example.com`
- `*.example.com` → `sub.example.com`, `a.b.example.com`
- `sub.example.com` → only `sub.example.com`

### 3. Select Conversion

```javascript
function convertSelect(selectElement) {
  // Prevent duplicate conversion
  if (convertedSelects.has(selectElement)) return;
  if (selectElement.classList.contains('choices__input')) return;
  if (!document.body.contains(selectElement)) return;

  try {
    const choices = new Choices(selectElement, {
      searchEnabled: true,
      searchPlaceholderValue: 'Search...',
      itemSelectText: '', // Empty - no unnecessary text
      noResultsText: 'No results found',
      noChoicesText: 'No choices to choose from',
      loadingText: 'Loading...',
      removeItemButton: false,
      shouldSort: false,
      position: 'auto',
      allowHTML: false
    });

    convertedSelects.add(selectElement);
  } catch (error) {
    console.error('Searchable Select: Error:', error);
  }
}
```

**Important configurations:**
- `itemSelectText: ''` → no unnecessary UI text
- `shouldSort: false` → preserve original order
- `allowHTML: false` → XSS protection

### 4. MutationObserver (Dynamic Elements)

```javascript
let debounceTimer = null;

const observer = new MutationObserver(function(mutations) {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(function() {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) {
          // Direct select element
          if (node.tagName === 'SELECT') {
            scheduleConversion(node);
          }
          // Select elements within the node
          const selects = node.querySelectorAll('select');
          selects.forEach(scheduleConversion);
        }
      });
    });
  }, 10); // 10ms debounce
});
```

**Why debouncing?**
- Reduces CPU usage
- Batch processing
- Avoids duplicate conversions

### 5. Multi-level Retry Mechanism

```javascript
function scheduleConversion(selectElement) {
  // Immediate attempt
  convertSelect(selectElement);

  // 1st retry - 50ms
  setTimeout(() => convertSelect(selectElement), 50);

  // 2nd retry - 150ms
  setTimeout(() => convertSelect(selectElement), 150);

  // 3rd retry - 300ms
  setTimeout(() => convertSelect(selectElement), 300);

  // 4th retry - 500ms
  setTimeout(() => convertSelect(selectElement), 500);
}
```

**Why multi-level?**
- Different AJAX timings
- Handles slow rendering
- Ensures conversion

### 6. Frame Handling

```javascript
function processFrame(frame) {
  if (processedFrames.has(frame)) return;

  const frameDoc = frame.contentDocument || frame.contentWindow?.document;
  const frameWindow = frame.contentWindow;

  if (!frameDoc || !frameWindow) {
    console.log('Frame not accessible (CORS?)');
    return;
  }

  // Check if Choices.js is loaded
  const choicesExists = typeof frameWindow.Choices !== 'undefined';

  if (!choicesExists) {
    // Dynamic loading
    injectChoicesIntoFrame(frame, frameDoc, frameWindow);
  } else {
    // Already loaded
    processFrameSelects(frameDoc, frameWindow);
  }

  processedFrames.add(frame);
}
```

### 7. Dynamic Choices.js Injection

```javascript
function injectChoicesIntoFrame(frame, frameDoc, frameWindow) {
  const choicesCssUrl = chrome.runtime.getURL('choices.min.css');
  const customCssUrl = chrome.runtime.getURL('custom-styles.css');
  const choicesJsUrl = chrome.runtime.getURL('choices.min.js');

  // Load CSS
  const choicesCssLink = frameDoc.createElement('link');
  choicesCssLink.rel = 'stylesheet';
  choicesCssLink.href = choicesCssUrl;
  frameDoc.head.appendChild(choicesCssLink);

  // Load JS
  const choicesScript = frameDoc.createElement('script');
  choicesScript.src = choicesJsUrl;
  choicesScript.onload = function() {
    console.log('Choices.js loaded into frame');
    processFrameSelects(frameDoc, frameWindow);
  };
  frameDoc.head.appendChild(choicesScript);
}
```

### 8. JSF/RichFaces AJAX Support

```javascript
function setupJSFAjaxHook(doc, win) {
  // JSF AJAX hook
  if (win.jsf && win.jsf.ajax) {
    const originalRequest = win.jsf.ajax.request;
    win.jsf.ajax.request = function() {
      originalRequest.apply(this, arguments);
      setTimeout(() => convertAllSelects(doc), 100);
      setTimeout(() => convertAllSelects(doc), 300);
      setTimeout(() => convertAllSelects(doc), 500);
    };
  }

  // RichFaces events
  if (win.RichFaces) {
    win.document.addEventListener('rich:ajax:complete', function() {
      setTimeout(() => convertAllSelects(doc), 100);
    });
  }
}
```

### 9. Global XHR Monitoring

```javascript
function setupXHRMonitoring(doc, win) {
  const originalOpen = win.XMLHttpRequest.prototype.open;
  const originalSend = win.XMLHttpRequest.prototype.send;

  win.XMLHttpRequest.prototype.open = function() {
    this._url = arguments[1];
    return originalOpen.apply(this, arguments);
  };

  win.XMLHttpRequest.prototype.send = function() {
    this.addEventListener('load', function() {
      setTimeout(() => convertAllSelects(doc), 100);
      setTimeout(() => convertAllSelects(doc), 300);
    });
    return originalSend.apply(this, arguments);
  };
}
```

## CSS Override Strategy (custom-styles.css)

### Philosophy

Use minimal overrides to avoid breaking the original appearance.

### Key Overrides

```css
/* Inline behavior */
.choices {
  display: inline-block !important;
  margin: 0 !important;
}

/* Automatic sizing */
.choices__inner {
  padding: 0 !important;
  height: auto !important;
  min-height: auto !important;
  width: auto !important;
}

/* Unlimited dropdown width */
.choices__list--dropdown {
  max-width: none !important;
  white-space: nowrap !important;
}
```

**Why `!important`?**
- Override Choices.js inline styles
- Consistent appearance across all websites

## Settings System (options.js)

### Storage Structure

```javascript
{
  enableAllDomains: true,           // boolean
  allowedDomains: [                 // string[]
    "example.com",
    "*.github.com",
    "localhost"
  ]
}
```

### Synchronization

Using Chrome Storage Sync API:
- Automatic sync with Google account
- Max 100KB storage
- Max 8KB / item

```javascript
chrome.storage.sync.set({
  enableAllDomains: true,
  allowedDomains: domains
}, function() {
  console.log('Settings saved');
});
```

## Performance Optimization

### 1. WeakSet Usage
- Automatic garbage collection
- O(1) lookup
- No memory leaks

### 2. Debouncing
- 10ms delay in MutationObserver
- Batch processing
- Reduced CPU usage

### 3. Multi-level Retry
- Only runs when necessary
- Different timings for different cases

### 4. Try-catch Blocks
- Handles CORS issues
- Doesn't stop the entire extension

## Testing

### Manual Tests

1. **Basic Functions** (`test.html`)
   - Simple select
   - Multi-select
   - Grouped select (optgroup)

2. **AJAX Functions** (`test-ajax.html`)
   - innerHTML method
   - createElement method
   - Delayed loading
   - setTimeout loading

3. **Frame Tests**
   - JSF frameset
   - Nested frames
   - Cross-domain iframes (CORS test)

### Debugging

```javascript
// Console messages:
console.log('Searchable Select: Extension initialized');
console.log('Searchable Select: Converted:', selectElement);
console.log('Frame processed:', frame.name);
console.error('Searchable Select: Error:', error);
```

**Using DevTools:**
1. F12 → Console
2. Look for messages starting with "Searchable Select" prefix
3. Check network tab for Choices.js loading

## Deployment

### Installing Extension

1. `chrome://extensions/`
2. Turn ON Developer mode
3. "Load unpacked"
4. Select the project folder

### Updating Extension

1. `chrome://extensions/`
2. Click the reload icon for the extension
3. Refresh test pages (F5)

### Version Update

1. Modify the version field in `manifest.json`
2. Update `CHANGELOG.md`
3. Update the "Recent changes" section in `README.md`

## Issues and Solutions

### Problem: "Choices is not defined"
**Cause:** Choices.js not loaded into frame
**Solution:** Check `web_accessible_resources` configuration

### Problem: CORS error in frames
**Cause:** Cross-domain iframe
**Solution:** Try-catch block, graceful fail

### Problem: Select not converting
**Cause:** DOM manipulation too fast
**Solution:** Multi-level retry mechanism

## Future Enhancement Opportunities

1. **Unit tests** - Using Jest or Mocha
2. **E2E tests** - Puppeteer or Playwright
3. **TypeScript migration** - Better type safety
4. **Build system** - Webpack or Rollup
5. **Minification** - Compress content script
6. **Internationalization** - Support more languages
7. **Theme support** - Dark mode, custom colors

## Useful Links

- [Choices.js documentation](https://github.com/choices-js/Choices)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
- [Manifest V3 migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [MutationObserver MDN](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
