# Security

## Audit summary

- **Message handling**: Only string messages `"exportNow"` and `"getBookmarksHtml"` are accepted. Caller must be the same extension (`sender` present and `sender.id === chrome.runtime.id`). Unknown or non-string messages are ignored.
- **Exported HTML**: Bookmark titles and URLs are escaped for HTML/attributes. Dangerous URL schemes (`javascript:`, `vbscript:`, `data:`, `file:`, `blob:`) are replaced with `#` so opening the file and clicking links cannot execute code.
- **Storage**: Only the `autoExport` boolean is stored; no secrets.
- **Permissions**: Minimal (`bookmarks`, `downloads`, `storage`). No host or content scripts.
- **No remote code**: No external scripts or eval of user data.

## Reporting issues

If you find a vulnerability, please report it responsibly (e.g. private disclosure to the maintainer).
