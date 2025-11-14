# Searchable Select - Chrome Bővítmény

Egy egyszerű Chrome bővítmény, ami automatikusan kereshetővé konvertálja az összes HTML `<select>` elemet a weboldalon a Choices.js könyvtár segítségével.

## Verzió

**v1.0.0** - Első hivatalos kiadás

Részletes változások: [CHANGELOG.md](CHANGELOG.md)

## Funkciók

- ✅ Automatikusan felismeri és konvertálja az összes `<select>` elemet
- 🔍 Keresés támogatás minden select-ben
- ⚡ Támogatja a dinamikusan hozzáadott select elemeket
- 📋 Működik egyszerű és többszörös select-ekkel
- 📂 Támogatja a csoportosított opciókat (optgroup)
- 🇭🇺 Magyar nyelvű felület
- ⚙️ **Beállítások oldal domain szűréssel**
- 🎯 **Wildcard támogatás domain megadáshoz** (pl. `*.google.com`)

## Telepítés

1. **Töltsd le vagy klónozd a projektet:**
   ```bash
   git clone <repository-url>
   cd old-select-search
   ```

2. **Nyisd meg a Chrome Extensions oldalt:**
   - Nyisd meg a Chrome böngészőt
   - Írd be a címsorba: `chrome://extensions/`
   - Vagy menj a `Menü → További eszközök → Bővítmények` menüpontra

3. **Engedélyezd a Fejlesztői módot:**
   - Kapcsold be a jobb felső sarokban a "Fejlesztői mód" kapcsolót

4. **Töltsd be a bővítményt:**
   - Kattints a "Kicsomagolt bővítmény betöltése" gombra
   - Válaszd ki a projekt mappáját (`old-select-search`)
   - A bővítmény megjelenik a listában

## Használat

### Alapértelmezett működés

Alapértelmezetten a bővítmény **minden weboldalon** automatikusan működik.

1. **Telepítés után:**
   - A bővítmény automatikusan elindul minden weboldalon
   - Minden `<select>` elem kereshetővé válik

2. **Tesztelés:**
   - Nyisd meg a `test.html` fájlt egy böngészőben
   - Láthatod a konvertált select elemeket keresési funkcióval

3. **Használat weboldalon:**
   - Kattints egy select elemre
   - Kezdj el gépelni az opcióban való kereséshez
   - Az eredmények azonnal szűrődnek

### Beállítások (Domain szűrés)

A bővítmény beállításait a következőképpen érheted el:

1. **Nyisd meg a beállításokat:**
   - Menj a `chrome://extensions/` oldalra
   - Keresd meg a "Searchable Select" bővítményt
   - Kattints a "Részletek" gombra
   - Görgess le és kattints a "Bővítmény beállításai" linkre

   **VAGY**

   - Jobb klikk a bővítmény ikonján a toolbar-on
   - "Beállítások" menüpont

2. **Domain szűrés beállítása:**
   - **"Minden weboldalon engedélyezve"** toggle:
     - BE: A bővítmény minden weboldalon működik (alapértelmezett)
     - KI: Csak a megadott domaineken működik

   - **Domain lista:**
     - Adj meg domain neveket soronként
     - Támogatott formátumok:
       - `example.com` - Pontos domain és aldomainek
       - `*.example.com` - Minden aldomain (wildcard)
       - `subdomain.example.com` - Konkrét aldomain

3. **Példa beállítások:**
   ```
   google.com
   *.github.com
   stackoverflow.com
   localhost
   ```

4. **Mentés:**
   - Kattints a "Mentés" gombra
   - A beállítások azonnal érvénybe lépnek
   - A már megnyitott oldalakat frissíteni kell (F5)

## Fájlstruktúra

```
old-select-search/
├── manifest.json          # Chrome bővítmény konfiguráció (Manifest V3)
├── content.js            # Fő script - select konverzió, AJAX/JSF támogatás, frame kezelés
├── options.html          # Beállítások oldal UI
├── options.js            # Beállítások oldal JavaScript logika
├── choices.min.js        # Choices.js v10.2.0 könyvtár (minified)
├── choices.min.css       # Choices.js alapértelmezett stílusok
├── custom-styles.css     # Egyéni CSS override-ok (magasság, padding, dropdown)
├── icon16.png           # Chrome extension ikon 16x16
├── icon48.png           # Chrome extension ikon 48x48
├── icon128.png          # Chrome extension ikon 128x128
├── test.html            # Teszt oldal - alapvető példák
├── test-ajax.html       # AJAX teszt oldal - dinamikus betöltés tesztelése
├── README.md            # Dokumentáció (ez a fájl)
└── CHANGELOG.md         # Részletes változások története
```

## Technológiák

- **Choices.js v10.2.0** - Vanilla JavaScript select replacement könyvtár
- **Chrome Manifest V3** - Legújabb Chrome extension API
- **MutationObserver** - Dinamikus elemek figyelése

## Hogyan működik?

1. A `content.js` betöltődik minden weboldalon
2. Megkeresi az összes `<select>` elemet
3. Inicializálja őket a Choices.js könyvtárral
4. Beállít egy MutationObserver-t a dinamikusan hozzáadott select elemek figyelésére
5. Az új select elemek automatikusan konvertálódnak

## Testreszabás

### Choices.js konfiguráció

Ha módosítani szeretnéd a Choices.js beállításokat, szerkeszd a `content.js` fájl convertSelect funkcióját:

```javascript
const choices = new Choices(selectElement, {
  searchEnabled: true,
  searchPlaceholderValue: 'Keresés...',
  itemSelectText: '', // Üres string - nem mutat semmit
  noResultsText: 'Nincs találat',
  noChoicesText: 'Nincs választható opció',
  loadingText: 'Betöltés...',
  removeItemButton: false,
  shouldSort: false,
  position: 'auto',
  allowHTML: false
});
```

További beállítási lehetőségekért lásd a [Choices.js dokumentációt](https://github.com/choices-js/Choices).

### CSS testreszabás

A `custom-styles.css` fájl tartalmazza az egyéni stílusokat, amelyek felülírják a Choices.js alapértelmezett megjelenését:

**Főbb stílusok:**
- `.choices` - Főkonténer stílus (inline-block, margin: 0)
- `.choices__inner` - Belső konténer (padding: 0, auto height, custom background #EFEFEF)
- `.choices__list--single` - Single select lista (padding: 0px 4px)
- `.choices__list--dropdown` - Legördülő lista (korlátlan szélesség, nowrap)
- `.choices__list--dropdown .choices__item` - Legördülő elemek (padding, nowrap)

**Kulcsfontosságú override-ok:**
```css
.choices {
  display: inline-block !important;
  margin: 0 !important;
  width: 100% !important;
}

.choices__inner {
  padding: 0 !important;
  height: auto !important;
  line-height: 1rem !important;
  min-height: auto !important;
  background-color: #EFEFEF !important;
  width: auto !important;
}

.choices__list--dropdown {
  max-width: none !important;
  white-space: nowrap !important;
}
```

## Hibakeresés

Ha a bővítmény nem működik:

1. Ellenőrizd, hogy a bővítmény engedélyezve van-e a `chrome://extensions/` oldalon
2. Nyisd meg a DevTools konzolt (F12) és keresd a "Searchable Select" kezdetű üzeneteket
3. Frissítsd az oldalt (F5) a bővítmény újratöltése után
4. Ellenőrizd, hogy vannak-e `<select>` elemek az oldalon

## Jegyzet

- A bővítmény minden weboldalon működik (`<all_urls>`)
- Nem gyűjt semmilyen adatot
- Nem kommunikál külső szerverekkel
- Teljesen offline működik

## Licenc

Ez a projekt oktatási és demonstrációs célokra készült.

## Változások története

A teljes változási naplót lásd: [CHANGELOG.md](CHANGELOG.md)

### v1.0.0 - Első hivatalos kiadás (2025-01-14)

**Funkciók:**
- Natív HTML select elemek automatikus kereshetővé tétele
- 10 nyelv támogatása (hu, en, de, fr, es, it, pt, ru, ja, zh_CN)
- Beállítások oldal domain szűréssel és wildcard támogatással
- Debug mód fejlesztőknek
- Dinamikus tartalom támogatás (AJAX, SPA-k)
- iframe támogatás (korlátozásokkal)
- Tiszta, modern UI

**Technikai:**
- Chrome Extension Manifest V3
- Choices.js v11.1.0
- MutationObserver dinamikus elemek figyeléséhez
- Chrome Storage Sync API
- WeakSet memória-hatékony követéshez
- Teljes i18n támogatás

## Ismert problémák és megoldások

### Probléma: Select elemek nem konvertálódnak
**Megoldás:**
1. Ellenőrizd, hogy a bővítmény engedélyezve van
2. Frissítsd az oldalt (F5)
3. Nézd meg a Console-t (F12) hibák után
4. Ellenőrizd a domain szűrés beállításokat

### Probléma: AJAX-al betöltött select-ek nem működnek
**Megoldás:**
- A bővítmény automatikusan figyeli a DOM változásokat
- JSF/RichFaces támogatás beépített
- Ha mégsem működik, frissítsd a bővítményt

### Probléma: Frame-ben lévő select-ek nem konvertálódnak
**Megoldás:**
- A v3.0.0+ verzió támogatja a frame-eket
- Choices.js automatikusan betöltődik minden frame-be
- `all_frames: true` a manifestben engedélyezi ezt

### Probléma: Magasság vagy szélesség hibás
**Megoldás:**
- Ellenőrizd a `custom-styles.css` fájlt
- A v3.2.0 optimalizált CSS-t használ
- Testreszabhatod a `.choices__inner` stílusokat

## Források

- [Choices.js GitHub](https://github.com/choices-js/Choices)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
