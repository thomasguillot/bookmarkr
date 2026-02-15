/**
 * Bookmarkr – service worker (runs in background).
 * Listens for bookmark events, handles messages from popup.
 * Security: message validation, sender check, URL sanitization, HTML escaping.
 */

const EXPORT_DEBOUNCE_MS = 500;
let exportTimeout = null;

const ICON_PATHS = {
	light: { 16: "icons/icon16-dark.png", 48: "icons/icon48-dark.png", 128: "icons/icon128-dark.png" },
	dark: { 16: "icons/icon16-light.png", 48: "icons/icon48-light.png", 128: "icons/icon128-light.png" },
};

function applyIconTheme(theme) {
	const path = theme === "dark" ? ICON_PATHS.dark : ICON_PATHS.light;
	chrome.action.setIcon({ path });
}

function initIconTheme() {
	chrome.storage.local.get("iconTheme", (data) => {
		applyIconTheme(data.iconTheme || "light");
	});
}

chrome.runtime.onInstalled.addListener(initIconTheme);
initIconTheme();

const DANGEROUS_URL_PREFIXES = [
	"javascript:",
	"vbscript:",
	"data:",
	"file:",
	"blob:",
];

function escapeHtml(text) {
	if (!text) return '';
	return String(text)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function sanitizeBookmarkUrl(url) {
	if (!url || typeof url !== "string") return "#";
	const trimmed = url.trim().toLowerCase();
	for (const prefix of DANGEROUS_URL_PREFIXES) {
		if (trimmed === prefix || trimmed.startsWith(prefix)) {
			return "#";
		}
	}
	return url.trim();
}

function unixTime(ms) {
	return ms ? Math.floor(ms / 1000) : Math.floor(Date.now() / 1000);
}

function nodeToNetscapeHtml(node) {
	if (!node) return '';
	if (node.url) {
		const addDate = unixTime(node.dateAdded);
		const modified = unixTime(node.dateGroupModified || node.dateAdded);
		const safeUrl = sanitizeBookmarkUrl(node.url);
		return `<DT><A HREF="${escapeHtml(safeUrl)}" ADD_DATE="${addDate}" LAST_MODIFIED="${modified}">${escapeHtml(node.title || '')}</A>\n`;
	}
	// Folder
	const addDate = unixTime(node.dateGroupModified || node.dateAdded);
	let out = `<DT><H3 ADD_DATE="${addDate}"${node.children?.length ? '' : ' FOLDED'}>${escapeHtml(node.title || '')}</H3>\n<DL><p>\n`;
	if (node.children?.length) {
		for (const child of node.children) {
			out += nodeToNetscapeHtml(child);
		}
	}
	out += '</DL><p>\n';
	return out;
}

function buildBookmarksHtml(tree) {
	if (!Array.isArray(tree)) return '';
	const header = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     Do Not Edit! -->
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Bookmarks</title>
<h1>Bookmarks</h1>
<dl><p>
`;
	let body = '';
	for (const root of tree) {
		if (root && root.children && root.children.length) {
			for (const node of root.children) {
				body += nodeToNetscapeHtml(node);
			}
		}
	}
	return header + body + '</dl><p>\n';
}

function exportBookmarks() {
	return new Promise((resolve, reject) => {
		chrome.bookmarks.getTree().then((tree) => {
			const html = buildBookmarksHtml(tree);
			const url = "data:text/html;charset=utf-8," + encodeURIComponent(html);
			const now = new Date();
			const date = now.toISOString().slice(0, 10);
			const time = now.toISOString().slice(11, 19).replace(/:/g, "-");
			const filename = `bookmarks-${date}-${time}.html`;
			chrome.downloads.download(
				{ url, filename, saveAs: false, conflictAction: "overwrite" },
				() => {
					const err = chrome.runtime.lastError;
					if (err) {
						reject(new Error(err.message));
					} else {
						resolve();
					}
				}
			);
		}).catch(reject);
	});
}

function scheduleExport() {
	if (exportTimeout) clearTimeout(exportTimeout);
	exportTimeout = setTimeout(() => {
		chrome.storage.sync.get("autoExport", (data) => {
			if (data.autoExport !== false) {
				exportBookmarks();
			}
		});
	}, EXPORT_DEBOUNCE_MS);
}

chrome.bookmarks.onCreated.addListener(scheduleExport);
chrome.bookmarks.onRemoved.addListener(scheduleExport);
chrome.bookmarks.onChanged.addListener(scheduleExport);
chrome.bookmarks.onMoved.addListener(scheduleExport);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (typeof msg !== "string") {
		return false;
	}
	if (!sender || sender.id !== chrome.runtime.id) {
		sendResponse({ ok: false, error: "Unauthorized" });
		return false;
	}
	if (msg === "exportNow") {
		exportBookmarks()
			.then(() => sendResponse({ ok: true }))
			.catch((err) => sendResponse({ ok: false, error: String(err) }));
		return true;
	}
	if (msg === "getBookmarksHtml") {
		(async () => {
			try {
				const tree = await chrome.bookmarks.getTree();
				const html = buildBookmarksHtml(tree);
				sendResponse({ ok: true, html });
			} catch (err) {
				sendResponse({ ok: false, error: String(err && err.message ? err.message : err) });
			}
		})();
		return true;
	}
	if (msg.startsWith("setIconTheme:")) {
		const theme = msg.slice("setIconTheme:".length);
		if (theme === "light" || theme === "dark") {
			chrome.storage.local.set({ iconTheme: theme });
			applyIconTheme(theme);
		}
		sendResponse({ ok: true });
		return false;
	}
	return false;
});
