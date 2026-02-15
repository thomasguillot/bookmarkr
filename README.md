# Bookmarkr

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Minimal Chrome extension that automatically exports a backup of your bookmarks in HTML (Netscape format) whenever you add, remove, or change a bookmark. [Changelog](CHANGELOG.md).

## Features

- **Auto-export** on any bookmark change (debounced)
- **Export manually** button to download a backup on demand

## Install

**Option A – Download a release (no build)**

1. Go to [Releases](https://github.com/thomasguillot/bookmarkr/releases) and download the latest `bookmarkr-*.zip`.
2. Unzip the file. You should get a folder containing `manifest.json`, a `build` folder, an `icons` folder, and `_locales`.
3. In Chrome, open a new tab and go to `chrome://extensions`.
4. Turn on **Developer mode** (toggle in the top-right).
5. Click **Load unpacked** and choose the unzipped folder (the one that contains `manifest.json`).
6. The extension is installed. Pin it from the puzzle icon in the toolbar if you like.

**Option B – From source**

1. Clone the repo, then from the project root: `npm install` and `npm run build`.
2. Open Chrome → **Extensions** → **Manage extensions** → **Load unpacked**
3. Select the `bookmarkr` folder (the one containing `manifest.json`).

## Usage

- After loading, any add/remove/edit/move of a bookmark triggers an export (when Auto-export is on). Files are saved to your Chrome Downloads folder as `bookmarks-YYYY-MM-DD-HH-MM-SS.html`.
- Click the extension icon to toggle **Auto-export** or click **Export manually** to download a backup once.

## Build

The popup UI is built with Vite + React + Chakra UI (`src/bookmarkr.html` + `src/bookmarkr.jsx`). The always-on logic (bookmark listeners, message handling) lives in `service-worker.js`. After cloning or changing the UI:

```bash
npm install
npm run build
```

Then load or reload the extension from the `bookmarkr` folder. The built popup lives in `build/`.

To rebuild only the icons after editing `icons/icon.svg`:

```bash
npm run build:icons
```

To create a release zip locally (e.g. for manual upload):

```bash
npm run release
```

This builds the extension and creates `bookmarkr-<version>.zip` (from `manifest.json`). Unzip it and use **Load unpacked** on the folder, or upload the zip to a [GitHub Release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository); if you publish a release, the **Release** workflow runs and attaches the zip automatically.

To lint JS/JSX and HTML:

```bash
npm run lint
npm run lint:fix   # auto-fix ESLint issues
```

## Platform

Default behavior is tuned for Mac (Downloads folder). The same extension works on Windows; Chrome uses the system's default download location.

## Translations

The UI and manifest use Chrome’s built-in i18n. Strings live in `_locales/<locale>/messages.json`. English (`en`) and French (`fr`) are included. Chrome picks the locale from the browser language. To add a language, add a folder `_locales/<code>/messages.json` with the same keys as `_locales/en/messages.json`.

## License

GPL-3.0-only. See [LICENSE](LICENSE).
