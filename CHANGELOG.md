# Changelog

## [3.0.0]

- **Local-only export**: Removed the Google Drive integration. Bookmarkr now saves exports to your Chrome Downloads folder only.
- **Two export buttons**: Replaced the single **Export** button (with a dropdown for HTML/Markdown) with two explicit buttons — **Export as HTML** and **Export as Markdown** — to make the choice clearer and avoid dropdown positioning issues inside the Chrome popup.
- **System theme**: The popup now follows your system light/dark theme automatically.
- **UI refresh**: Rebuilt the popup with Tailwind + shadcn for a cleaner, more native look.
- **Codebase**: Migrated the popup and service worker to TypeScript.
- **Icon behavior**: Single #101010 icon by default, switches to a version with a white rounded background while exporting.

## [2.0.0]

- **Manual export only**: Removed auto-export; export runs only when you click **Export**.
- **Export destination**: Choose **Local** (save to Downloads) or **Google Drive** (upload to a **Bookmarkr** folder at the root of your Drive). Same filename as local HTML export (e.g. `bookmarks-YYYY-MM-DD-HH-MM-SS.html`).
- **Google Drive**: Uses Chrome identity (OAuth) and the Google Drive API. On first export to Drive the extension creates or reuses a root folder named **Bookmarkr** and uploads the file there. Optional host permission for `https://www.googleapis.com/*` is requested when exporting to Drive.
- **Local export formats**: When **Local** is selected, the **Export** button now opens a menu with **Export as HTML** and **Export as Markdown** options. Markdown exports create files like `bookmarks-YYYY-MM-DD-HH-MM-SS.md` in your Downloads folder.

## [1.0.1]

- Icon follows system light/dark mode (dark icon on light toolbar, light icon on dark toolbar).

## [1.0.0]

- Initial release.
