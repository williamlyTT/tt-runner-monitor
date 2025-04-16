# Tenstorrent Runner Monitor

A Chrome extension to monitor Tenstorrent GitHub runners.

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Replace the GitHub token in `background.js`:
   - Open `background.js` in a text editor
   - Replace `"ghp_NOTMYREALPAT"` with your own GitHub Personal Access Token
   - Make sure to keep the quotes around your token
4. Build the extension:
   ```bash
   npm run build
   ```
   This will create bundled files in the `dist/` directory.

5. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

## Development

### Building
- `npm run build` - Build the extension once
- `npm run watch` - Build and watch for changes (automatically rebuilds when files change)

### Project Structure
- `background.js` - Background service worker
- `popup.js` - Popup UI logic
- `popup.html` - Popup UI
- `manifest.json` - Extension configuration
- `dist/` - Built files (do not edit directly)

### Dependencies
- lz-string - For data compression
- esbuild - For bundling JavaScript files

### Notes
- The `dist/` directory is generated during build and should not be committed to version control
- Make sure to run `npm run build` after making changes to JavaScript files