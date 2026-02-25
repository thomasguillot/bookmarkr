# Changelog

## [2.0.0]

- **Manual export only**: Removed auto-export; export runs only when you click **Export**.
- **Export destination**: Choose **Local** (save to Downloads) or **Google Drive** (upload to a **Bookmarkr** folder at the root of your Drive). Same filename as local HTML export (e.g. `bookmarks-YYYY-MM-DD-HH-MM-SS.html`).
- **Google Drive**: Uses Chrome identity (OAuth) and the Google Drive API. On first export to Drive the extension creates or reuses a root folder named **Bookmarkr** and uploads the file there. Optional host permission for `https://www.googleapis.com/*` is requested when exporting to Drive.
- **Local export formats**: When **Local** is selected, the **Export** button now opens a menu with **Export as HTML** and **Export as Markdown** options. Markdown exports create files like `bookmarks-YYYY-MM-DD-HH-MM-SS.md` in your Downloads folder.

## [1.0.1]

- Icon follows system light/dark mode (dark icon on light toolbar, light icon on dark toolbar).

## [1.0.0]

Initial release.
