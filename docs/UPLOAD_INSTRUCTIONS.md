# Chrome Web Store Feltöltési Útmutató

## ✅ Elkészült Fájlok

### 📦 Bővítmény Package
**Fájl**: `searchable-select-v1.0.0.zip` (63 KB)

**Tartalom:**
- manifest.json
- JavaScript fájlok (content.js, options.js, i18n-manager.js)
- HTML (options.html)
- CSS fájlok (choices.min.css, custom-styles.css)
- Choices.js library (choices.min.js)
- Ikonok (16x16, 48x48, 128x128)
- 10 nyelv fordítása (_locales/)

### 🖼️ Promóciós Képek (külön feltöltendők)
- `icon128.png` - 128x128px (Store ikon)
- `promo-tile-440x280.png` - 440x280px (Kis promóciós csempe)
- `marquee-920x680.png` - 920x680px (Nagy promóciós csempe)
- `marquee-1400x560.png` - 1400x560px (Marquee banner)

### 📸 Képernyőképek (külön feltöltendők)
1. `screenshot1-1280x800.png` - Keresés működés közben
2. `screenshot2-1280x800.png` - Beállítások oldal
3. `screenshot3-1280x800.png` - Előtte/Utána összehasonlítás

### 📄 Leírás
- `STORE_DESCRIPTION.md` - Teljes Store leírás szövege

---

## 🚀 Feltöltési Lépések

### 1. Chrome Web Store Developer Dashboard
Menj ide: https://chrome.google.com/webstore/devconsole

### 2. Új Bővítmény Létrehozása
- Kattints a **"New Item"** gombra
- Töltsd fel a **`searchable-select-v1.0.0.zip`** fájlt
- Várj, amíg feltöltődik és validálódik

### 3. Store Listing - Alapadatok

**Product details:**
- **Name**: Searchable Select
- **Summary** (132 karakter max):
  ```
  Transform classic HTML select elements into searchable dropdowns. Find options instantly with keyboard search on any website.
  ```

### 4. Store Listing - Grafikák

**Icon:**
- Töltsd fel: `icon128.png`

**Screenshots** (legalább 1, max 5 ajánlott):
1. `screenshot1-1280x800.png`
   - Caption: "Instant search in HTML select boxes - Type to filter options in real-time"
2. `screenshot2-1280x800.png`
   - Caption: "Customizable settings - Choose language, configure domains, enable debug mode"
3. `screenshot3-1280x800.png`
   - Caption: "Before vs After - See the difference Searchable Select makes"

**Promotional images** (opcionális, de ajánlott):
- Small promo tile (440x280): `promo-tile-440x280.png`
- Large promo tile (920x680): `marquee-920x680.png`
- Marquee (1400x560): `marquee-1400x560.png`

### 5. Store Listing - Leírás

**Detailed description** (lásd `STORE_DESCRIPTION.md`):

```
Make Classic HTML Dropdowns Searchable - Find Options Instantly!

Tired of scrolling through long dropdown lists? Searchable Select automatically transforms classic HTML <select> elements on any website into powerful, searchable dropdowns with instant filtering.

Important: This extension works with traditional HTML select boxes (the standard <select> tag). It does not modify custom-built dropdown components created with divs, JavaScript libraries, or CSS-only solutions.

✨ Key Features

🔍 Instant Search
- Type to search in any dropdown menu
- Real-time filtering as you type
- Keyboard navigation support
- Works with unlimited options

🌐 Universal Compatibility
- Automatically works on ALL websites with standard HTML select elements
- Handles dynamic content and AJAX-loaded select boxes
- Supports iframes and nested elements
- Works with native <select> tags only
- No configuration needed

[... további részletek a STORE_DESCRIPTION.md-ből]
```

### 6. Privacy Practices

**Single purpose description:**
```
This extension transforms native HTML select elements into searchable dropdowns with instant filtering, making it easier to find options in long dropdown lists.
```

**Permission justifications:**
- **storage**: Required to save user preferences including language selection, domain filtering settings, and debug mode options. All data is stored locally.

**Data usage:**
```
This extension does not collect, store, or transmit any user data.

- No data collection
- No tracking or analytics
- No external server communication
- Settings stored locally only using Chrome's storage API
- Full privacy protection

All functionality runs entirely in your browser.
```

**Privacy Policy** (kötelező URL vagy szöveg):
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

### 7. Distribution

**Pricing:**
- ✅ Free

**Visibility:**
- ✅ Public

**Distribution:**
- ✅ All regions (vagy válaszd ki a kívánt országokat)

### 8. Category & Language

**Category:**
- Primary: **Productivity**

**Language:**
- **English** (default)
- Additional: Hungarian, German, French, Spanish, Italian, Portuguese, Russian, Japanese, Chinese

### 9. Submit for Review

- Ellenőrizd, hogy minden mező ki van töltve
- Nézd át a preview-t
- Kattints **"Submit for review"**

---

## ⏱️ Jóváhagyási Idő

- Általában **1-3 munkanap**
- Első alkalommal akár 5-7 nap is lehet
- Email értesítést kapsz az eredményről

---

## 📋 Gyakori Elutasítási Okok (és hogy elkerültük őket)

✅ **Metadata quality** - Részletes leírás, képernyőképek ✓
✅ **Privacy policy** - Egyértelmű adatvédelmi szabályzat ✓
✅ **Permission justification** - Minden engedély indokolva ✓
✅ **Functionality** - Működő, tesztelt kód ✓
✅ **Icon quality** - Professzionális ikonok ✓
✅ **Spam/Keyword stuffing** - Természetes leírás ✓

---

## 🔄 Frissítések

Későbbi frissítésekhez:
1. Növeld a verziószámot a `manifest.json`-ben
2. Készíts új ZIP-et
3. Dashboard → Edit → Package → Upload new version
4. Submit for review

---

## 💡 Tippek

- **Responsive support**: Gyorsan válaszolj a user review-kra
- **Regular updates**: Javítsd a bugokat, add hozzá az új funkciókat
- **Monitor analytics**: Nézd a telepítési/eltávolítási statisztikákat
- **Promote**: Oszd meg social media-n, fórumokon

---

## 📞 Support

Ha elutasítják:
1. Olvasd el az elutasítás okát
2. Javítsd a problémát
3. Küldd be újra

Ha kérdésed van:
- Chrome Web Store Support
- developer.chrome.com/docs/webstore/

---

**Sok sikert a bővítmény publikálásához! 🚀**
