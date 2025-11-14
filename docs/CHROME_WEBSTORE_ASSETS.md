# Chrome Web Store Assets - Searchable Select

Ez a dokumentum tartalmazza az összes szükséges anyagot a Chrome Web Store-ba való feltöltéshez.

## ✅ Elkészült Fájlok

### 📱 Ikonok
- ✅ `icon16.png` - 16x16px (böngésző eszköztár)
- ✅ `icon48.png` - 48x48px (bővítmények oldal)
- ✅ `icon128.png` - 128x128px (Chrome Web Store, bővítmény részletek)
- ✅ `icon.svg` - Vektoros forrás fájl

### 🖼️ Promóciós Képek
- ✅ `promo-tile-440x280.png` - Kis promóciós csempe (440x280px)
- ✅ `marquee-920x680.png` - Nagy promóciós csempe (920x680px)
- ✅ `marquee-1400x560.png` - Marquee banner (1400x560px)

### 📸 Képernyőképek
- ✅ `screenshot1-1280x800.png` - Főfunkció demonstráció (keresés dropdown-ban)
- ✅ `screenshot2-1280x800.png` - Beállítások oldal
- ✅ `screenshot3-1280x800.png` - Előtte/Utána összehasonlítás

### 📄 Dokumentáció
- ✅ `STORE_DESCRIPTION.md` - Teljes leírás, címkék, kategória információkkal

## 📋 Chrome Web Store Követelmények

### Szükséges Képméretek:
| Típus | Méret | Fájl | Státusz |
|-------|-------|------|---------|
| Icon | 128x128 | icon128.png | ✅ |
| Small promo tile | 440x280 | promo-tile-440x280.png | ✅ |
| Large promo tile | 920x680 | marquee-920x680.png | ✅ |
| Marquee | 1400x560 | marquee-1400x560.png | ✅ |
| Screenshots | 1280x800 vagy 640x400 | screenshot*.png | ✅ |

## 🎨 Design Jellemzők

### Színpaletta:
- Fő gradient: `#667eea` → `#764ba2` (lila-rózsaszín)
- Accent gradient: `#f093fb` → `#f5576c`
- Háttér: Fehér + világos szürke
- Szöveg: `#333` (dark), `#666` (medium), `#999` (light)

### Tipográfia:
- Font: Arial, sans-serif
- Heading: 32-72px, bold
- Body: 14-24px, regular/medium
- Caption: 12-16px

## 📝 Feltöltési Checklist

### Alapinformációk:
- [x] **Név**: Searchable Select
- [x] **Rövid leírás**: Transform every dropdown menu into a searchable field
- [x] **Kategória**: Productivity
- [x] **Nyelv**: English (10+ locale támogatással)

### Képek:
- [x] Icon (128x128)
- [x] Kis promóciós csempe (440x280) - opcionális
- [x] Nagy promóciós csempe (920x680) - opcionális
- [x] Marquee (1400x560) - opcionális
- [x] Legalább 1 képernyőkép (ajánlott 3-5)

### Leírások:
- [x] Részletes leírás (lásd: STORE_DESCRIPTION.md)
- [x] Címkék/kulcsszavak
- [x] Adatvédelmi szabályzat szöveg

### Technikai:
- [x] manifest.json validált
- [x] Összes nyelvi fájl validált (10 nyelv)
- [x] Ikonok helyes méretben
- [x] Permissions dokumentálva

## 🌍 Támogatott Nyelvek

A bővítmény 10 nyelven elérhető:
1. 🇭🇺 Magyar (hu)
2. 🇬🇧 English (en)
3. 🇩🇪 Deutsch (de)
4. 🇫🇷 Français (fr)
5. 🇪🇸 Español (es)
6. 🇮🇹 Italiano (it)
7. 🇵🇹 Português (pt)
8. 🇷🇺 Русский (ru)
9. 🇯🇵 日本語 (ja)
10. 🇨🇳 中文 (zh_CN)

## 📊 Képernyőképek Leírása

### Screenshot 1: Főfunkció
**Fájl**: `screenshot1-1280x800.png`
**Leírás**: "Instant search in any dropdown - Type to filter options in real-time"
- Mutatja a keresés funkcionalitást egy országok listájában
- Látható a begépelt "uni" szöveg és a szűrt eredmények
- Kiemeli a 3 találatot: United States, United Kingdom, United Arab Emirates

### Screenshot 2: Beállítások
**Fájl**: `screenshot2-1280x800.png`
**Leírás**: "Customizable settings - Choose language, configure domains, enable debug mode"
- Beállítások oldal teljes nézete
- Nyelvválasztó dropdown
- Domain szűrés toggle kapcsolók
- Fejlesztői beállítások

### Screenshot 3: Előtte/Utána
**Fájl**: `screenshot3-1280x800.png`
**Leírás**: "Before vs After - See the difference Searchable Select makes"
- Oldalról összehasonlítás
- Bal oldal: hagyományos dropdown problémái
- Jobb oldal: kereshetővé tett dropdown előnyei
- Vizuális kontraszttal

## 🔐 Adatvédelmi Szabályzat

**Rövid verzió (Chrome Web Store-hoz):**

```
Privacy Policy

This extension does not collect, store, or transmit any user data.

Data Collection: NONE
- We do not track your browsing
- We do not collect personal information
- We do not use analytics or tracking tools

Data Storage: LOCAL ONLY
- Settings are stored locally in your browser using Chrome's storage API
- Language preferences and domain filters remain on your device
- No data is sent to external servers

Permissions Used:
- "storage": To save your preferences (language, domain settings)

All functionality runs entirely in your browser. Your privacy is fully protected.

Contact: izll81@gmail.com
```

## 📦 Tömörítés Web Store-hoz

A bővítmény feltöltéséhez készíts egy ZIP fájlt az alábbi fájlokkal:

```bash
zip -r searchable-select-v1.0.0.zip \
  manifest.json \
  content.js \
  options.js \
  options.html \
  i18n.js \
  i18n-manager.js \
  choices.min.js \
  choices.min.css \
  custom-styles.css \
  icon16.png \
  icon48.png \
  icon128.png \
  _locales/
```

**NE tömörítsd bele:**
- .git/
- node_modules/
- *.svg forrás fájlok
- demo-*.html fájlok
- screenshot SVG fájlok
- STORE_*.md dokumentációs fájlok

## 🚀 Feltöltési Lépések

1. **Chrome Web Store Developer Dashboard**: https://chrome.google.com/webstore/devconsole
2. **Új bővítmény**: Kattints "New Item" gombra
3. **ZIP feltöltés**: Töltsd fel a tömörített fájlt
4. **Store Listing**:
   - Töltsd fel az ikonokat
   - Add meg a leírást (STORE_DESCRIPTION.md alapján)
   - Töltsd fel a képernyőképeket
   - Add meg a kategóriát (Productivity)
5. **Privacy**: Illeszd be az adatvédelmi szabályzatot
6. **Pricing & Distribution**: Ingyenes, minden régióban
7. **Publish**: Küldd el jóváhagyásra

## ✅ Végső Ellenőrzés

- [x] Manifest.json valid és V3 kompatibilis
- [x] Összes JSON nyelvi fájl valid
- [x] Ikonok megfelelő méretben és formátumban
- [x] Képernyőképek informatívak és professzionálisak
- [x] Leírás pontos és vonzó
- [x] Nincs hardcoded szöveg, minden i18n-nel kezelve
- [x] Nincs külső függőség (minden lokális)
- [x] Adatvédelmi szabályzat egyértelmű

## 📞 Kapcsolat

- **Email**: izll81@gmail.com
- **Támogatás**: PayPal link a beállítások oldalon

---

**Státusz**: ✅ KÉSZ A FELTÖLTÉSRE

Minden szükséges anyag elkészült és készen áll a Chrome Web Store-ba való feltöltésre!
