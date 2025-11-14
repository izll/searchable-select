# Changelog

## [3.6.4] - 2025-01-13

### Changed
- Eltávolítva a verzió log a konzoból a tisztább megjelenés érdekében
- A bővítmény most teljesen csendben működik, hacsak nincs hiba vagy be nincs kapcsolva a debug mód

## [3.6.3] - 2025-01-13

### Changed
- Eltávolítva a W3Schools-specifikus automatikus debug logging
- Debug logok most csak akkor jelennek meg, ha be van kapcsolva a debug mód az options oldalon

## [3.6.2] - 2025-01-13

### Changed
- Összes console.log átalakítva debugLog-ra a tisztább konzol kimenet érdekében
- Debug üzenetek most csak akkor jelennek meg, ha engedélyezve van a debug mód

## [3.6.1] - 2025-01-13

### Fixed
- Javítva a frameWindow is not defined hiba az iframe feldolgozás során
- Hozzáadva a hiányzó frameWindow változó deklaráció

## [3.6.0] - 2025-01-13

### Changed
- **BREAKING CHANGE**: Új megközelítés az iframe kezelésre
- NEM injektáljuk többé a Choices.js-t az iframe-ekbe (CSP korlátozások miatt)
- Csak a CSS-t injektáljuk az iframe-ekbe
- A parent window Choices osztályát használjuk az iframe select elemein

### Known Issues
- **Strict CSP korlátok**: Az iframe-ekben lévő select elemek nem működnek teljesen strict Content Security Policy esetén (pl. W3Schools Tryit Editor)
- A select elemek konvertálódnak, de a dropdown nem nyílik meg click eseményre cross-document környezetben
- Ez egy fundamental limitation: a Choices.js nem támogatja a cross-document használatot

## [3.5.9] - 2025-01-13

### Attempted
- Blob URL használata a Choices.js injektálásához az iframe-ekbe
- CSP által blokkolva

## [3.5.8] - 2025-01-13

### Attempted
- Inline script injektálás az iframe-ekbe
- CSP által blokkolva

## [3.5.7] - 2025-01-13

### Attempted
- Polling mechanizmus a Choices osztály létrejöttének ellenőrzésére (50x20ms)
- Nem oldotta meg az iframe script betöltési problémát

## [3.5.6] - 2025-01-13

### Attempted
- 200ms timeout növelés a script végrehajtáshoz
- Nem volt elég

## [3.4.4] - 2025-01-13

### Changed
- searchResultLimit átállítva Infinity-re (teszt céljából)
- Lehetővé teszi az összes találat megjelenítését a keresésben

## [Korábbi verziók]

### Features
- HTML select elemek automatikus konvertálása kereshetővé a Choices.js segítségével
- Beállítások oldal domain-specifikus engedélyekkel
- Debug mód kapcsoló
- MutationObserver dinamikus tartalom figyeléshez
- JSF/RichFaces/PrimeFaces AJAX kompatibilitás
- iframe támogatás (korlátozásokkal)
- Manifest V3 támogatás

### Korlátozások
1. **Strict CSP környezetek**: Nem működik teljesen iframe-ekben strict Content Security Policy esetén
2. **Cross-document**: A Choices.js event handling nem működik cross-document esetben
3. **Cross-origin iframe-ek**: Nem férhetünk hozzá cross-origin iframe tartalmához (CORS védelem)

### Technikai részletek
- Chrome Extension Manifest V3
- Choices.js v11.1.0
- Content scripts minden frame-ben (all_frames: true)
- MutationObserver dinamikus elem detektáláshoz
- Chrome storage API beállítások mentéséhez
