# Searchable Select - Chrome Extension

A simple Chrome extension that automatically converts all HTML `<select>` elements on web pages to searchable ones using the SlimSelect library.

## Version

**v1.0.2** - Color and width settings, AJAX fixes

Detailed changes: [CHANGELOG.md](CHANGELOG.md)

## Features

- ✅ Automatically detects and converts all `<select>` elements
- 🔍 Search support in all selects
- ⚡ Supports dynamically added select elements (AJAX/JSF)
- 📋 Works with simple and multiple selects
- 📂 Supports grouped options (optgroup)
- 🌍 **Support for 10 languages** (hu, en, de, fr, es, it, pt, ru, ja, zh_CN)
- ⚙️ **Settings page with domain filtering**
- 🎯 **Wildcard support for domain specification** (e.g., `*.google.com`)
- 🎨 **Customizable selection color**
- 📐 **Width mode** - automatic or original width

## Installation

1. **Download or clone the project:**
   ```bash
   git clone <repository-url>
   cd old-select-search
   ```

2. **Open the Chrome Extensions page:**
   - Open Chrome browser
   - Type in the address bar: `chrome://extensions/`
   - Or go to `Menu → More tools → Extensions`

3. **Enable Developer mode:**
   - Turn on the "Developer mode" toggle in the top right corner

4. **Load the extension:**
   - Click the "Load unpacked" button
   - Select the project folder (`old-select-search`)
   - The extension will appear in the list

## Usage

### Default behavior

By default, the extension automatically works on **all websites**.

1. **After installation:**
   - The extension starts automatically on all websites
   - All `<select>` elements become searchable

2. **Testing:**
   - Open the `test.html` file in a browser
   - You can see the converted select elements with search functionality

3. **Using on websites:**
   - Click on a select element
   - Start typing to search within options
   - Results are filtered instantly

### Settings (Domain filtering)

You can access the extension settings as follows:

1. **Open settings:**
   - Go to the `chrome://extensions/` page
   - Find the "Searchable Select" extension
   - Click the "Details" button
   - Scroll down and click the "Extension options" link

   **OR**

   - Right-click the extension icon in the toolbar
   - "Options" menu item

2. **Configure domain filtering:**
   - **"Enabled on all websites"** toggle:
     - ON: The extension works on all websites (default)
     - OFF: Only works on specified domains

   - **Domain list:**
     - Enter domain names one per line
     - Supported formats:
       - `example.com` - Exact domain and subdomains
       - `*.example.com` - All subdomains (wildcard)
       - `subdomain.example.com` - Specific subdomain

3. **Example settings:**
   ```
   google.com
   *.github.com
   stackoverflow.com
   localhost
   ```

4. **Saving:**
   - Click the "Save" button
   - Settings take effect immediately
   - Already open pages need to be refreshed (F5)

## File structure

```
old-select-search/
├── manifest.json          # Chrome extension configuration (Manifest V3)
├── content.js            # Main script - select conversion, AJAX/JSF support, frame handling
├── options.html          # Settings page UI
├── options.js            # Settings page JavaScript logic
├── slimselect.min.js     # SlimSelect v3.2.0 library (minified)
├── slimselect.min.css    # SlimSelect default styles
├── custom-styles.css     # Custom CSS overrides (height, padding, dropdown)
├── icon16.png           # Chrome extension icon 16x16
├── icon48.png           # Chrome extension icon 48x48
├── icon128.png          # Chrome extension icon 128x128
├── test.html            # Test page - basic examples
├── test-ajax.html       # AJAX test page - dynamic loading testing
├── README.md            # Documentation (this file)
└── CHANGELOG.md         # Detailed change history
```

## Technologies

- **SlimSelect v3.2.0** - Vanilla JavaScript select replacement library
- **Chrome Manifest V3** - Latest Chrome extension API
- **MutationObserver** - Monitoring dynamic elements

## How does it work?

1. The `content.js` loads on all web pages
2. It finds all `<select>` elements
3. Initializes them with the SlimSelect library
4. Sets up a MutationObserver to watch for dynamically added select elements
5. New select elements are automatically converted

## Customization

### SlimSelect configuration

If you want to modify SlimSelect settings, edit the convertSelect function in the `content.js` file:

```javascript
const slim = new SlimSelect({
  select: selectElement,
  settings: {
    showSearch: true,
    focusSearch: true,
    searchPlaceholder: 'Search...',
    searchText: 'No results',
    searchHighlight: true,
    closeOnSelect: true,
    allowDeselect: false,
    openPosition: 'auto',
    placeholderText: ''
  }
});
```

For more configuration options, see the [SlimSelect documentation](https://slimselectjs.com/).

### CSS customization

The `custom-styles.css` file contains custom styles that override SlimSelect's default appearance:

**Main styles:**
- `.ss-main` - Main container style (inline-flex, margin: 0)
- `.ss-content` - Dropdown container (max-height, z-index)
- `.ss-option` - Dropdown items (padding, hover effect)
- `.ss-search` - Search field styles

**Key overrides:**
```css
.ss-main {
  display: inline-flex !important;
  margin: 0 !important;
  width: auto !important;
}

.ss-content {
  max-height: 400px !important;
  z-index: 9999 !important;
}

.ss-option {
  padding: 8px 12px !important;
  white-space: nowrap !important;
}
```

## Troubleshooting

If the extension is not working:

1. Check that the extension is enabled on the `chrome://extensions/` page
2. Open DevTools console (F12) and look for messages starting with "Searchable Select"
3. Refresh the page (F5) after reloading the extension
4. Check if there are `<select>` elements on the page

## Note

- The extension works on all websites (`<all_urls>`)
- Does not collect any data
- Does not communicate with external servers
- Works completely offline

## License

This project was created for educational and demonstration purposes.

## Change history

See the full changelog: [CHANGELOG.md](CHANGELOG.md)

### v1.0.2 - Color and width settings (2025-01-25)

**New features:**
- 🎨 Customizable selection and hover color in settings
- 📐 Width mode selection (automatic / original width)
- 🔒 Width cache - original size preserved after AJAX/JSF refresh

**Fixes:**
- Fixed disappearing/incorrectly sized selects after AJAX
- Improved hiding of original select element

### v1.0.1 - SlimSelect switch (2025-01-25)

**Changes:**
- Replaced Choices.js with SlimSelect v3.2.0
- Blue color scheme
- More compact appearance

### v1.0.0 - First official release (2025-01-14)

**Features:**
- Automatic conversion of native HTML select elements to searchable
- Support for 10 languages (hu, en, de, fr, es, it, pt, ru, ja, zh_CN)
- Settings page with domain filtering and wildcard support
- Debug mode for developers
- Dynamic content support (AJAX, SPAs)
- iframe support (with limitations)
- Clean, modern UI

## Known issues and solutions

### Issue: Select elements are not converted
**Solution:**
1. Check that the extension is enabled
2. Refresh the page (F5)
3. Check the Console (F12) for errors
4. Check domain filtering settings

### Issue: AJAX-loaded selects don't work
**Solution:**
- The extension automatically monitors DOM changes
- JSF/RichFaces support is built-in
- If it still doesn't work, update the extension

### Issue: Selects in frames are not converted
**Solution:**
- Version v3.0.0+ supports frames
- SlimSelect is automatically loaded in all frames
- `all_frames: true` in the manifest enables this

### Issue: Height or width is incorrect
**Solution:**
- Check the `custom-styles.css` file
- Version v3.2.0 uses optimized CSS
- You can customize `.ss-main` styles

## Resources

- [SlimSelect documentation](https://slimselectjs.com/)
- [SlimSelect GitHub](https://github.com/brianvoe/slim-select)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
