# Changelog

All notable changes to Searchable Select will be documented in this file.

## [1.0.0] - 2025-01-14

### Initial Release

First official release of Searchable Select Chrome Extension.

#### Features
- 🔍 **Automatic search enhancement** for all native HTML `<select>` elements
- 🌍 **10 languages supported**: Hungarian, English, German, French, Spanish, Italian, Portuguese, Russian, Japanese, Chinese
- ⚙️ **Settings page** with domain filtering and wildcard support (e.g., `*.example.com`)
- 🐛 **Debug mode** for troubleshooting
- ⚡ **Dynamic content support** via MutationObserver
- 🖼️ **iframe support** (with limitations in strict CSP environments)
- 🎨 **Clean, modern UI** that matches native select appearance
- 💾 **Local storage only** - no data collection or external communication

#### Technical Details
- Chrome Extension Manifest V3
- Choices.js v11.1.0
- Content scripts run in all frames (`all_frames: true`)
- MutationObserver for dynamic element detection
- Chrome Storage API for settings persistence
- WeakSet for memory-efficient element tracking
- Full i18n support with `chrome.i18n` API

#### Known Limitations
1. **Strict CSP environments**: Limited functionality in iframes with strict Content Security Policy (e.g., W3Schools Tryit Editor)
2. **Cross-document events**: Choices.js event handling doesn't work across document boundaries
3. **Cross-origin iframes**: Cannot access cross-origin iframe content (CORS protection)
4. **Native select only**: Works only with native HTML `<select>` elements, not custom dropdown libraries

#### Privacy
- No data collection
- No external communication
- Settings stored locally only
- No analytics or tracking
