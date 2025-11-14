# Searchable Select - Fejlesztési Dokumentáció

## 📋 Projekt Áttekintés

**Név**: Searchable Select
**Verzió**: 1.0.0
**Típus**: Chrome Extension (Manifest V3)
**Cél**: Klasszikus HTML `<select>` elemek átalakítása kereshetővé

---

## 🎯 Főbb Funkciók

### Alapfunkció
- Automatikusan észleli és átalakítja a natív HTML `<select>` elemeket
- Valós idejű keresés a dropdown opciók között
- Billentyűzet navigáció (fel/le nyíl, Enter)
- Működik dinamikus tartalommal (AJAX, SPA-k)
- Iframe támogatás

### Beállítások
- **Nyelv választás**: 10 nyelv támogatása
- **Domain szűrés**: Engedélyezés/tiltás specifikus domaineken
- **Debug mód**: Fejlesztői konzol naplózás
- Szép, modern beállítások felület

### Technikai Jellemzők
- Manifest V3 kompatibilis
- Choices.js library alapú
- MutationObserver a dinamikus tartalom figyelésére
- WeakSet a konvertált elemek nyomon követésére
- Teljes i18n támogatás

---

## 📅 Fejlesztési Kronológia

### Kezdeti Állapot
- Már létező bővítmény volt korábbi munkamenetből
- `searchResultLimit: 1000` volt beállítva
- W3Schools Tryit Editor iframe-jében nem működött
- Csak magyar nyelv volt
- Nem volt donate gomb
- Debug logok mindig megjelentek

### Első Lépések

#### 1. Infinity limit teszt
- `searchResultLimit` átállítva `1000` → `Infinity`
- Cél: Minden találat megjelenítése korlátozás nélkül

#### 2. W3Schools iframe debug
Többszöri próbálkozás az iframe támogatás javítására:
- **v3.5.5-3.5.9**: Különböző script injection módszerek
  - External script src
  - setTimeout késleltetések (50ms, 200ms)
  - Polling mechanizmus
  - Inline script injection
  - Blob URL megoldás
- **Probléma**: Content Security Policy (CSP) blokkolja az összes injection módszert
- **Megoldás v3.6.0**: Parent window Choices osztály használata, csak CSS injection az iframe-be
- **Korlátozás**: Dropdown renderelődik, de click event-ek nem működnek cross-document miatt
- **Elfogadás**: Dokumentálva Known Limitations-ként

#### 3. Debug log tisztítás
- Új `debugLog()` függvény létrehozása
- Minden `console.log` → `debugLog` csere
- W3Schools specifikus auto-logging eltávolítása
- Verzió log eltávolítása a konzoból

#### 4. Donate gombok hozzáadása
- PayPal.me linkek a beállítások oldalra
- 4 összeg: $1, $2, $5 (popular), $10
- Gradient stílusú gombok hover effekttel
- "⭐ Popular" badge a $5-ös gombon

#### 5. Verzió reset
- Verzió `3.6.4` → `1.0.0` (official release)

### Internacionalizáció (i18n)

#### 6. Első lépések - Magyar és Angol
- `_locales/hu/messages.json` létrehozása
- `_locales/en/messages.json` létrehozása
- `i18n.js` helper script (DOM alapú fordítás)
- `manifest.json` frissítés: `__MSG_extName__`, `default_locale: "hu"`
- `options.html` frissítés: `data-i18n` attribútumok
- `options.js` részleges frissítés: `chrome.i18n.getMessage()`

#### 7. options.js teljes i18n
- `saveSettings()` frissítés
- `resetSettings()` frissítés
- `updateDomainCount()` frissítés
- Minden üzenet használja a `chrome.i18n.getMessage()`

#### 8. content.js i18n
- Choices.js konfigurációs stringek (searchPlaceholder, noResults, noChoices, loading)
- `getLocalizedMessage()` async függvény létrehozása
- `convertSelect()` async-re alakítás
- iframe konverzió frissítése

### Nyelv Választó Implementálás

#### 9. i18n-manager.js létrehozása
- `getCurrentLanguage()`: Nyelv lekérése storage-ből
- `setLanguage()`: Nyelv mentése
- `getTranslatedMessage()`: Fordítás fetch-elése JSON-ből
- `applyTranslations()`: DOM frissítés

#### 10. options.html frissítés
- Új "Nyelv beállítások" szekció a tetején
- Language select dropdown
- CSS stílus a select elemhez

#### 11. options.js nyelvváltás
- Nyelv betöltése oldal betöltéskor
- Language change event listener
- Tabok értesítése nyelv változásról
- Settings mentéskor nyelv küldése

#### 12. content.js nyelv kezelés
- `language` hozzáadva settings-hez
- `languageChanged` üzenet kezelése
- Oldal újratöltés megerősítés új nyelven

### Több Nyelv Hozzáadása

#### 13. 8 új nyelv implementálása
Létrehozva `_locales/` mappák és `messages.json` fájlok:
- 🇩🇪 Német (de)
- 🇫🇷 Francia (fr)
- 🇪🇸 Spanyol (es)
- 🇮🇹 Olasz (it)
- 🇵🇹 Portugál (pt)
- 🇷🇺 Orosz (ru)
- 🇯🇵 Japán (ja)
- 🇨🇳 Kínai egyszerűsített (zh_CN)

Minden nyelvhez:
- Teljes `messages.json` (~40 kulcs)
- Összes UI szöveg lefordítva
- Nyelv nevek hozzáadva magyar és angol fájlokhoz

#### 14. JSON validálás
- **Hiba**: Kínai fájlban `"` és `"` karakterek (kínai idézőjelek)
- **Javítás**: Escape-elés `\"` formátumban
- Minden nyelvi fájl validálva: `python3 -m json.tool`

### Chrome Web Store Előkészítés

#### 15. Ikonok generálása
- `icon.svg` forrás (lila-rózsaszín gradient, dropdown + nagyító)
- PNG konverziók ImageMagick-kel:
  - `icon16.png` (16x16) - eszköztár
  - `icon48.png` (48x48) - bővítmények oldal
  - `icon128.png` (128x128) - Web Store

#### 16. Promóciós képek
- `promo-tile.svg` → `promo-tile-440x280.png` (kis csempe)
- `marquee.svg` → `marquee-1400x560.png` és `marquee-920x680.png`
- Gradient háttér, ikon, szöveges felsorolás

#### 17. Képernyőképek generálása
3 SVG mockup készítése és PNG konverzió:
- **Screenshot 1**: Keresés működés közben (dropdown + "uni" szűrés)
- **Screenshot 2**: Beállítások oldal teljes nézet
- **Screenshot 3**: Előtte/Utána összehasonlítás

#### 18. Store leírás
- `STORE_DESCRIPTION.md` létrehozása:
  - Rövid leírás (132 karakter)
  - Részletes leírás
  - Funkciók, használati esetek
  - Technikai jellemzők
  - Adatvédelmi szabályzat
  - Címkék, kategória

### Finomhangolás

#### 19. Natív select tisztázás
Minden anyag frissítése, hogy világos legyen: **csak natív HTML `<select>` elemekkel működik**

**Frissített fájlok:**
- `STORE_DESCRIPTION.md`: "Works with traditional HTML select boxes"
- `_locales/hu/messages.json`: "Csak natív <select> tagekkel működik"
- `_locales/en/messages.json`: "Works only with native <select> tags"
- Minden SVG grafika szövege

**Frissített képek:**
- `promo-tile.svg`: "Search in HTML dropdowns"
- `marquee.svg`: "Works with native HTML <select> tags"
- `screenshot1.svg`: "HTML select boxes"
- `screenshot2.svg`: "native HTML select tags"
- `screenshot3.svg`: "Standard HTML Select" vs "Enhanced HTML Select"

#### 20. Promo tile szöveg javítás
- Eredeti: "Make HTML select boxes searchable" (kilógott)
- Javítva: "Search in HTML dropdowns" (rövidebb, belefér)

#### 21. Dokumentációk
- `CHROME_WEBSTORE_ASSETS.md`: Összes asset felsorolása, követelmények
- `UPLOAD_INSTRUCTIONS.md`: Részletes feltöltési útmutató
- `DEVELOPMENT_LOG.md`: Ez a fájl

#### 22. Végleges package
- `searchable-select-v1.0.0.zip` (63 KB)
- Tartalmaz mindent: kód, ikonok, 10 nyelv
- Kizár: SVG forrásokat, dokumentációt, demo fájlokat

---

## 📁 Fájlstruktúra

```
old-select-search/
├── manifest.json              # Chrome extension manifest V3
├── content.js                 # Main content script (select conversion)
├── options.js                 # Settings page logic
├── options.html               # Settings page UI
├── i18n.js                    # Simple i18n helper (deprecated)
├── i18n-manager.js            # Advanced i18n manager
├── choices.min.js             # Choices.js library
├── choices.min.css            # Choices.js styles
├── custom-styles.css          # Custom overrides
├── icon16.png                 # 16x16 icon
├── icon48.png                 # 48x48 icon
├── icon128.png                # 128x128 icon
├── icon.svg                   # Icon source
├── promo-tile.svg             # Promo tile source
├── promo-tile-440x280.png     # Small promo tile
├── marquee.svg                # Marquee source
├── marquee-1400x560.png       # Large marquee
├── marquee-920x680.png        # Medium marquee
├── screenshot1.svg            # Screenshot 1 source
├── screenshot1-1280x800.png   # Screenshot 1
├── screenshot2.svg            # Screenshot 2 source
├── screenshot2-1280x800.png   # Screenshot 2
├── screenshot3.svg            # Screenshot 3 source
├── screenshot3-1280x800.png   # Screenshot 3
├── _locales/                  # Translations
│   ├── hu/messages.json       # Hungarian
│   ├── en/messages.json       # English
│   ├── de/messages.json       # German
│   ├── fr/messages.json       # French
│   ├── es/messages.json       # Spanish
│   ├── it/messages.json       # Italian
│   ├── pt/messages.json       # Portuguese
│   ├── ru/messages.json       # Russian
│   ├── ja/messages.json       # Japanese
│   └── zh_CN/messages.json    # Chinese
├── STORE_DESCRIPTION.md       # Store listing text
├── CHROME_WEBSTORE_ASSETS.md  # Assets checklist
├── UPLOAD_INSTRUCTIONS.md     # Upload guide
├── DEVELOPMENT_LOG.md         # This file
└── searchable-select-v1.0.0.zip  # Final package
```

---

## 🛠️ Technikai Implementáció

### manifest.json
```json
{
  "manifest_version": 3,
  "name": "__MSG_extName__",
  "version": "1.0.0",
  "description": "__MSG_extDescription__",
  "default_locale": "hu",
  "permissions": ["storage"],
  "options_page": "options.html",
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["choices.min.js", "content.js"],
    "css": ["choices.min.css", "custom-styles.css"],
    "run_at": "document_end",
    "all_frames": true
  }],
  "icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  }
}
```

### content.js főbb funkciók
- `debugLog()`: Kondicionális logging
- `loadSettings()`: Storage sync beállítások betöltése
- `isCurrentDomainAllowed()`: Domain whitelist ellenőrzés
- `getLocalizedMessage()`: Async fordítás betöltés
- `convertSelect()`: Select elem Choices.js-re alakítás
- `initObserver()`: MutationObserver dinamikus tartalom figyelésére
- `processFrame()`: Iframe select elemek kezelése

### i18n-manager.js
- Fetch-eli a `_locales/{lang}/messages.json` fájlokat
- Placeholder helyettesítés (`$1`, `$COUNT$`)
- DOM frissítés `data-i18n` attribútumok alapján
- Export: `window.i18nManager` objektum

### options.js
- Chrome Storage API használat
- Nyelv váltás + fordítások frissítése
- Domain lista kezelés (wildcard támogatás)
- Tab üzenetek küldése beállítás változáskor

---

## 🎨 Design Rendszer

### Színpaletta
```css
/* Főszínek */
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--accent-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

/* Szöveg */
--text-dark: #333;
--text-medium: #666;
--text-light: #999;

/* Háttér */
--bg-light: #f8f9fa;
--bg-white: #ffffff;
--border: #e0e0e0;
```

### Tipográfia
- Font: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Heading: 28-72px, bold
- Body: 14-18px, regular/medium
- Caption: 12-14px

---

## 🌍 Támogatott Nyelvek

| Kód | Nyelv | Fordítás állapota |
|-----|-------|-------------------|
| hu | Magyar | ✅ 100% |
| en | English | ✅ 100% |
| de | Deutsch | ✅ 100% |
| fr | Français | ✅ 100% |
| es | Español | ✅ 100% |
| it | Italiano | ✅ 100% |
| pt | Português | ✅ 100% |
| ru | Русский | ✅ 100% |
| ja | 日本語 | ✅ 100% |
| zh_CN | 中文 | ✅ 100% |

---

## 🐛 Ismert Korlátozások

### 1. Strict CSP Környezetek
- **Probléma**: Egyes iframe-ek (pl. W3Schools Tryit) strict Content Security Policy-val rendelkeznek
- **Hatás**: Script injection blokkolva
- **Megoldás**: Parent window Choices használata + CSS injection
- **Korlátozás**: Dropdown renderelődik, de interakció korlátozott

### 2. Cross-Origin Iframe-ek
- **Probléma**: CORS védelem
- **Hatás**: Nem lehet elérni a cross-origin iframe tartalmát
- **Megoldás**: Nincs, biztonsági korlátozás

### 3. Custom Dropdown Library-k
- **Probléma**: React Select, Vue Select, Semantic UI stb.
- **Hatás**: Ezek már saját keresési funkciókkal rendelkeznek
- **Megoldás**: Szándékosan nem módosítjuk őket (csak natív `<select>`)

---

## 📊 Statisztikák

### Kód Méret
- `content.js`: ~25 KB (79% tömörítés ZIP-ben)
- `options.js`: ~6 KB (76% tömörítés)
- `choices.min.js`: ~70 KB (73% tömörítés)
- Összesen ZIP: 63 KB

### Támogatott Nyelvek
- 10 nyelv
- ~40 fordítási kulcs nyelvenként
- 400+ fordított string összesen

### Grafikai Anyagok
- 3 ikon méret (16, 48, 128)
- 3 promóciós kép (440x280, 920x680, 1400x560)
- 3 képernyőkép (1280x800)

---

## ✅ Tesztelés

### Manuális Tesztek
- ✅ Chrome betöltés (load unpacked)
- ✅ Manifest validálás
- ✅ JSON nyelvfájlok validálása
- ✅ Select konverzió különböző oldalakon
- ✅ Beállítások oldal működés
- ✅ Nyelv váltás
- ✅ Domain szűrés
- ✅ Debug mód

### Kompatibilitás
- ✅ Chrome (elsődleges)
- ✅ Edge (Chromium-alapú)
- ✅ Brave (Chromium-alapú)
- ⚠️ Firefox (Manifest V3 támogatás limitált)

---

## 🚀 Kiadás

### v1.0.0 (2025-01-XX)
**Első hivatalos kiadás**

Funkciók:
- Natív HTML select elemek kereshetővé tétele
- 10 nyelv támogatása
- Domain szűrés
- Debug mód
- Modern beállítások UI
- PayPal donate gombok

Technikai:
- Manifest V3
- Choices.js v11.1.0
- MutationObserver
- Chrome Storage Sync API
- Teljes i18n

---

## 📞 Kapcsolat & Támogatás

- **Email**: izll81@gmail.com
- **PayPal**: https://www.paypal.com/paypalme/izll81/
- **Chrome Web Store**: (hamarosan)

---

## 📝 Licensz

(Nincs megadva - adjál hozzá LICENSE fájlt ha szükséges)

---

## 🙏 Köszönetnyilvánítás

- **Choices.js**: Josh Johnson (https://github.com/Choices-js/Choices)
- **ImageMagick**: Képkonverziók
- **Chrome Extensions API**: Google

---

**Utolsó frissítés**: 2025-01-14
**Dokumentáció verziója**: 1.0
**Státusz**: ✅ KÉSZ A PUBLIKÁLÁSRA
