# Fejlesztői dokumentáció - Searchable Select

Ez a dokumentum a bővítmény belső működését és fejlesztési folyamatát írja le.

## Architektúra áttekintés

### Komponensek

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

### Fő folyamat

1. **Inicializáció** (`document_end`)
   - Beállítások betöltése Chrome Storage-ból
   - Domain ellenőrzés
   - Select elemek keresése és konvertálása

2. **DOM megfigyelés** (MutationObserver)
   - Új select elemek automatikus észlelése
   - Debouncing (10ms) a teljesítmény optimalizáláshoz
   - Többszintű retry mechanizmus (50ms, 150ms, 300ms, 500ms)

3. **Frame kezelés**
   - Rekurzív frame feldolgozás
   - Choices.js dinamikus betöltése minden frame-be
   - Frame-enkénti MutationObserver

4. **AJAX/JSF támogatás**
   - JSF AJAX hook (`jsf.ajax.request`)
   - RichFaces esemény listener-ek
   - XMLHttpRequest globális monitorozás

## Kód struktúra (content.js)

### 1. Változók és állapot kezelés

```javascript
const convertedSelects = new WeakSet(); // Konvertált elemek nyilvántartása
const processedFrames = new WeakSet(); // Feldolgozott frame-ek

let settings = {
  enableAllDomains: true,
  allowedDomains: []
};
```

**Miért WeakSet?**
- Automatikus memória felszabadítás
- Nincs memory leak
- Gyors lookup (O(1))

### 2. Domain ellenőrzés

```javascript
function isCurrentDomainAllowed() {
  if (settings.enableAllDomains) return true;

  const currentHostname = window.location.hostname;

  return settings.allowedDomains.some(domain => {
    if (domain.includes('*')) {
      // Wildcard támogatás: *.example.com
      const pattern = domain.replace(/\*/g, '.*').replace(/\./g, '\\.');
      const regex = new RegExp('^' + pattern + '$', 'i');
      return regex.test(currentHostname);
    }

    // Pontos egyezés vagy aldomain
    return currentHostname === domain || currentHostname.endsWith('.' + domain);
  });
}
```

**Támogatott formátumok:**
- `example.com` → `example.com`, `sub.example.com`
- `*.example.com` → `sub.example.com`, `a.b.example.com`
- `sub.example.com` → csak `sub.example.com`

### 3. Select konverzió

```javascript
function convertSelect(selectElement) {
  // Duplikált konverzió elkerülése
  if (convertedSelects.has(selectElement)) return;
  if (selectElement.classList.contains('choices__input')) return;
  if (!document.body.contains(selectElement)) return;

  try {
    const choices = new Choices(selectElement, {
      searchEnabled: true,
      searchPlaceholderValue: 'Keresés...',
      itemSelectText: '', // Üres - nem mutat felesleges szöveget
      noResultsText: 'Nincs találat',
      noChoicesText: 'Nincs választható opció',
      loadingText: 'Betöltés...',
      removeItemButton: false,
      shouldSort: false,
      position: 'auto',
      allowHTML: false
    });

    convertedSelects.add(selectElement);
  } catch (error) {
    console.error('Searchable Select: Hiba:', error);
  }
}
```

**Fontos konfigurációk:**
- `itemSelectText: ''` → nincs felesleges UI szöveg
- `shouldSort: false` → eredeti sorrend megtartása
- `allowHTML: false` → XSS védelem

### 4. MutationObserver (Dinamikus elemek)

```javascript
let debounceTimer = null;

const observer = new MutationObserver(function(mutations) {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(function() {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) {
          // Közvetlen select elem
          if (node.tagName === 'SELECT') {
            scheduleConversion(node);
          }
          // Select elemek a node-on belül
          const selects = node.querySelectorAll('select');
          selects.forEach(scheduleConversion);
        }
      });
    });
  }, 10); // 10ms debounce
});
```

**Miért debouncing?**
- Csökkenti a CPU használatot
- Batch processing
- Elkerüli a duplikált konverziókat

### 5. Többszintű retry mechanizmus

```javascript
function scheduleConversion(selectElement) {
  // Azonnali próbálkozás
  convertSelect(selectElement);

  // 1. retry - 50ms
  setTimeout(() => convertSelect(selectElement), 50);

  // 2. retry - 150ms
  setTimeout(() => convertSelect(selectElement), 150);

  // 3. retry - 300ms
  setTimeout(() => convertSelect(selectElement), 300);

  // 4. retry - 500ms
  setTimeout(() => convertSelect(selectElement), 500);
}
```

**Miért többszintű?**
- Különböző AJAX időzítések
- Lassú renderelés kezelése
- Biztosítja a konverziót

### 6. Frame kezelés

```javascript
function processFrame(frame) {
  if (processedFrames.has(frame)) return;

  const frameDoc = frame.contentDocument || frame.contentWindow?.document;
  const frameWindow = frame.contentWindow;

  if (!frameDoc || !frameWindow) {
    console.log('Frame nem elérhető (CORS?)');
    return;
  }

  // Choices.js betöltés ellenőrzése
  const choicesExists = typeof frameWindow.Choices !== 'undefined';

  if (!choicesExists) {
    // Dinamikus betöltés
    injectChoicesIntoFrame(frame, frameDoc, frameWindow);
  } else {
    // Már be van töltve
    processFrameSelects(frameDoc, frameWindow);
  }

  processedFrames.add(frame);
}
```

### 7. Choices.js dinamikus injektálás

```javascript
function injectChoicesIntoFrame(frame, frameDoc, frameWindow) {
  const choicesCssUrl = chrome.runtime.getURL('choices.min.css');
  const customCssUrl = chrome.runtime.getURL('custom-styles.css');
  const choicesJsUrl = chrome.runtime.getURL('choices.min.js');

  // CSS betöltés
  const choicesCssLink = frameDoc.createElement('link');
  choicesCssLink.rel = 'stylesheet';
  choicesCssLink.href = choicesCssUrl;
  frameDoc.head.appendChild(choicesCssLink);

  // JS betöltés
  const choicesScript = frameDoc.createElement('script');
  choicesScript.src = choicesJsUrl;
  choicesScript.onload = function() {
    console.log('Choices.js betöltve frame-be');
    processFrameSelects(frameDoc, frameWindow);
  };
  frameDoc.head.appendChild(choicesScript);
}
```

### 8. JSF/RichFaces AJAX támogatás

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

### 9. XHR globális monitorozás

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

## CSS override stratégia (custom-styles.css)

### Filozófia

Minimális override-ok használata, hogy ne törjük el az eredeti megjelenést.

### Kulcsfontosságú override-ok

```css
/* Inline viselkedés */
.choices {
  display: inline-block !important;
  margin: 0 !important;
}

/* Automatikus méretezés */
.choices__inner {
  padding: 0 !important;
  height: auto !important;
  min-height: auto !important;
  width: auto !important;
}

/* Dropdown korlátlan szélesség */
.choices__list--dropdown {
  max-width: none !important;
  white-space: nowrap !important;
}
```

**Miért `!important`?**
- Choices.js inline style-ok felülírása
- Konzisztens megjelenés minden weboldalon

## Beállítások rendszer (options.js)

### Storage struktúra

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

### Szinkronizáció

Chrome Storage Sync API használata:
- Automatikus sync Google fiókkal
- Max 100KB storage
- Max 8KB / item

```javascript
chrome.storage.sync.set({
  enableAllDomains: true,
  allowedDomains: domains
}, function() {
  console.log('Beállítások mentve');
});
```

## Teljesítmény optimalizálás

### 1. WeakSet használata
- Automatikus garbage collection
- O(1) lookup
- Nincs memory leak

### 2. Debouncing
- 10ms késleltetés a MutationObserver-ben
- Batch processing
- CPU használat csökkentése

### 3. Többszintű retry
- Csak szükséges esetekben fut le
- Különböző időzítések különböző esetekre

### 4. Try-catch blokkok
- CORS problémák kezelése
- Nem állítja le az egész bővítményt

## Tesztelés

### Manuális tesztek

1. **Alap funkciók** (`test.html`)
   - Egyszerű select
   - Multi-select
   - Grouped select (optgroup)

2. **AJAX funkciók** (`test-ajax.html`)
   - innerHTML módszer
   - createElement módszer
   - Késleltetett betöltés
   - setTimeout betöltés

3. **Frame tesztek**
   - JSF frameset
   - Nested frame-ek
   - Cross-domain iframe-ek (CORS teszt)

### Hibakeresés

```javascript
// Console üzenetek:
console.log('Searchable Select: Bővítmény inicializálva');
console.log('Searchable Select: Konvertálva:', selectElement);
console.log('Frame feldolgozva:', frame.name);
console.error('Searchable Select: Hiba:', error);
```

**DevTools használata:**
1. F12 → Console
2. Keresd a "Searchable Select" prefix-szel kezdődő üzeneteket
3. Ellenőrizd a network tab-ot Choices.js betöltéséhez

## Deployment

### Bővítmény telepítése

1. `chrome://extensions/`
2. Fejlesztői mód BE
3. "Kicsomagolt bővítmény betöltése"
4. Válaszd ki a projekt mappát

### Bővítmény frissítése

1. `chrome://extensions/`
2. Kattints a reload ikonra a bővítménynél
3. Frissítsd a tesztoldalakat (F5)

### Verzió frissítés

1. Módosítsd `manifest.json` version mezőjét
2. Frissítsd `CHANGELOG.md`-t
3. Frissítsd `README.md` "Legfrissebb változások" szekciót

## Hibák és megoldások

### Probléma: "Choices is not defined"
**Ok:** Choices.js nem töltődött be a frame-be
**Megoldás:** Ellenőrizd a `web_accessible_resources` konfigurációt

### Probléma: CORS error frame-eknél
**Ok:** Cross-domain iframe
**Megoldás:** Try-catch blokk, graceful fail

### Probléma: Select nem konvertálódik
**Ok:** Túl gyors DOM manipuláció
**Megoldás:** Többszintű retry mechanizmus

## Továbbfejlesztési lehetőségek

1. **Unit tesztek** - Jest vagy Mocha használatával
2. **E2E tesztek** - Puppeteer vagy Playwright
3. **TypeScript migráció** - Jobb type safety
4. **Build rendszer** - Webpack vagy Rollup
5. **Minification** - Content script tömörítése
6. **Internationalization** - Több nyelv támogatása
7. **Theme support** - Dark mode, custom színek

## Hasznos linkek

- [Choices.js dokumentáció](https://github.com/choices-js/Choices)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
- [Manifest V3 migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [MutationObserver MDN](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
