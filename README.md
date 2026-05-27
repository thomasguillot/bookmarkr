# Bookmarkr

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Minimal Chrome extension that exports a backup of your bookmarks to your computer. [Changelog](CHANGELOG.md).

## Features

- **Export as HTML** – download a Netscape-format bookmark file (re-importable into any browser) to your Chrome Downloads folder
- **Export as Markdown** – download a hierarchical Markdown version of your bookmarks
- Follows your system light/dark theme

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

Click the extension icon, then click **Export as HTML** or **Export as Markdown**. The file is saved to your Chrome Downloads folder with a timestamped name like `bookmarks-YYYY-MM-DD-HH-MM-SS.html` or `.md`.

## Build

The popup is built with Vite + React + Tailwind + shadcn (`src/bookmarkr.html` + `src/bookmarkr.tsx`). The background logic (message handling, bookmark serialization) lives in `src/service-worker.ts`. Both are built into `build/` by Vite.

```bash
npm install
npm run build
```

Then load or reload the extension from the project root (the folder containing `manifest.json`).

To rebuild only the icons after editing `icons/icon.svg`:

```bash
npm run build:icons
```

To create a release zip locally (e.g. for manual upload):

```bash
npm run release
```

This builds the extension and creates `bookmarkr-<version>.zip` (from `manifest.json`). Unzip it and use **Load unpacked** on the folder, or upload the zip to a [GitHub Release](https://github.com/thomasguillot/bookmarkr/releases); if you publish a release, the **Release** workflow runs and attaches the zip automatically.

To type-check and lint:

```bash
npm run typecheck
npm run lint
npm run lint:fix   # auto-fix ESLint issues
```

## Platform

Default behavior is tuned for Mac (Downloads folder). The same extension works on Windows; Chrome uses the system's default download location.

## Translations

The UI and manifest use Chrome's built-in i18n. Strings live in `_locales/<locale>/messages.json`. English (`en`) and French (`fr`) are included. Chrome picks the locale from the browser language. To add a language, add a folder `_locales/<code>/messages.json` with the same keys as `_locales/en/messages.json`.

## License

GPL-3.0-only. See [LICENSE](LICENSE).
