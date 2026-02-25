# Bookmarkr

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Minimal Chrome extension that exports a backup of your bookmarks. Choose to save to your computer (Downloads) or to Google Drive. [Changelog](CHANGELOG.md).

## Features

- **Export to Local** – download a bookmark backup file as **HTML** or **Markdown** to your Chrome Downloads folder
- **Export to Google Drive** – upload the same HTML file to a folder named **Bookmarkr** at the root of your Drive (CURRENTLY NOT WORKING)

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

- Click the extension icon. Choose **Local** to save backups to your Downloads folder, or **Google Drive** to upload to a **Bookmarkr** folder in your Drive.
- For **Local** exports, click **Export** and choose **Export as HTML** or **Export as Markdown**. Local exports create a file like `bookmarks-YYYY-MM-DD-HH-MM-SS.html` or `bookmarks-YYYY-MM-DD-HH-MM-SS.md` in your Downloads folder.
- For **Google Drive** exports, click **Export** to upload the HTML file. Google Drive exports create or use a root folder named **Bookmarkr** and upload the same HTML file there.
- **Google Drive**: The first time you export to Drive, you sign in with your Google account (no API key or setup—just sign in). The extension then uploads the file to a **Bookmarkr** folder in your Drive.

> **Note**: Google Drive export will not work until we configure an OAuth 2.0 Client ID in `manifest.json` (no extra setup is required from end users once that is done).

## For extension publishers (Google Drive)

If you **publish** or **build** this extension (e.g. you maintain the repo or distribute a zip), you must configure an OAuth 2.0 client once so that **users** can sign in. End users never create a project or API key—they only see the normal Google sign-in when they export to Drive.

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project, enable **Google Drive API**, then **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Chrome application**. Add your extension’s **Application ID** (from `chrome://extensions`; for unpacked builds, add a `key` in `manifest.json` for a stable ID).
3. Put the **Client ID** in `manifest.json` under `oauth2.client_id` (replace `YOUR_CLIENT_ID.apps.googleusercontent.com`).

After that, everyone who installs your build just signs in with Google when they use Export to Drive.

## Build

The popup UI is built with Vite + React + Chakra UI (`src/bookmarkr.html` + `src/bookmarkr.jsx`). The background logic (message handling) lives in `service-worker.js`. After cloning or changing the UI:

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

This builds the extension and creates `bookmarkr-<version>.zip` (from `manifest.json`). Unzip it and use **Load unpacked** on the folder, or upload the zip to a [GitHub Release](https://github.com/thomasguillot/bookmarkr/releases); if you publish a release, the **Release** workflow runs and attaches the zip automatically.

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
