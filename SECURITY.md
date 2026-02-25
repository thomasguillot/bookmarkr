# Security

## Audit summary

- **Message handling**: Only string messages `"getBookmarksHtml"` and `"setIconTheme:<theme>"` are accepted. Caller must be the same extension (`sender` present and `sender.id === chrome.runtime.id`). Unknown or non-string messages are ignored.
- **Exported HTML**: Bookmark titles and URLs are escaped for HTML/attributes. Dangerous URL schemes (`javascript:`, `vbscript:`, `data:`, `file:`, `blob:`) are replaced with `#` so opening the file and clicking links cannot execute code.
- **Storage**: `chrome.storage.sync` stores only the export destination (`local` or `gdrive`). No credentials are stored.
- **Permissions**: `bookmarks`, `downloads`, `storage`, `identity`. Optional host permission `https://www.googleapis.com/*` is used only when the user exports to Google Drive, so the extension can call the Drive API. Bookmark data is sent only to Google Drive when the user chooses that destination and completes sign-in.
- **Identity**: Google sign-in uses Chrome’s `identity` API and the OAuth 2.0 client ID configured in the manifest. No client secret is stored; tokens are managed by Chrome.
- **No remote code**: No external scripts or eval of user data.

## Reporting issues

If you find a vulnerability, please report it responsibly (e.g. private disclosure to the maintainer).
