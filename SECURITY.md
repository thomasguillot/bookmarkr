# Security

## Audit summary

- **Message handling**: Only string messages `"getBookmarksHtml"`, `"getBookmarksMarkdown"`, `"setIconState:idle"`, and `"setIconState:exporting"` are accepted. Caller must be the same extension (`sender` present and `sender.id === chrome.runtime.id`). Unknown or non-string messages are ignored.
- **Exported HTML**: Bookmark titles and URLs are escaped for HTML/attributes. Dangerous URL schemes (`javascript:`, `vbscript:`, `data:`, `file:`, `blob:`) are replaced with `#` so opening the file and clicking links cannot execute code.
- **Storage**: `chrome.storage.sync` stores only the export destination (`local` or `github`). `chrome.storage.local` stores the GitHub access token when the user connects their GitHub account.
- **Permissions**: `bookmarks`, `downloads`, `storage`, `identity`. Bookmark data is sent only to GitHub when the user chooses the GitHub destination and completes GitHub authorization; otherwise it is written to a local download file.
- **Identity / GitHub**: GitHub sign-in uses GitHub’s OAuth flow (with PKCE). The extension embeds a GitHub OAuth client ID (no client secret) and exchanges the authorization code for an access token directly with GitHub. The token is stored locally and used only to manage the user’s private `bookmarkr-export` repository.
- **No remote code**: No external scripts or eval of user data.

## Reporting issues

If you find a vulnerability, please report it responsibly (e.g. private disclosure to the maintainer).
