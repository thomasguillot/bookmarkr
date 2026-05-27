/**
 * Bookmarkr – service worker (runs in background).
 * Handles messages from popup (get bookmarks HTML/Markdown, icon state).
 * Security: message validation, sender check, URL sanitization, HTML escaping.
 */

type IconState = "idle" | "exporting";

interface IconPathSet {
	[size: number]: string;
	16: string;
	48: string;
	128: string;
}

const ICON_PATHS: Record<IconState, IconPathSet> = {
	idle: { 16: "icons/icon16-export.png", 48: "icons/icon48-export.png", 128: "icons/icon128-export.png" },
	exporting: { 16: "icons/icon16-export.png", 48: "icons/icon48-export.png", 128: "icons/icon128-export.png" },
};

function setIconState(state: IconState): void {
	const path = state === "exporting" ? ICON_PATHS.exporting : ICON_PATHS.idle;
	chrome.action.setIcon({ path });
}

chrome.runtime.onInstalled.addListener(() => {
	setIconState("idle");
});
setIconState("idle");

const DANGEROUS_URL_PREFIXES: readonly string[] = [
	"javascript:",
	"vbscript:",
	"data:",
	"file:",
	"blob:",
];

function escapeHtml(text: string | undefined | null): string {
	if (!text) return "";
	return String(text)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function escapeMarkdown(text: string | undefined | null): string {
	if (!text) return "";
	return String(text)
		.replace(/\\/g, "\\\\")
		.replace(/`/g, "\\`")
		.replace(/\*/g, "\\*")
		.replace(/_/g, "\\_")
		.replace(/{/g, "\\{")
		.replace(/}/g, "\\}")
		.replace(/\[/g, "\\[")
		.replace(/]/g, "\\]")
		.replace(/\(/g, "\\(")
		.replace(/\)/g, "\\)")
		.replace(/#/g, "\\#")
		.replace(/\+/g, "\\+")
		.replace(/-/g, "\\-")
		.replace(/!/g, "\\!");
}

function sanitizeBookmarkUrl(url: string | undefined | null): string {
	if (!url || typeof url !== "string") return "#";
	const trimmed = url.trim().toLowerCase();
	for (const prefix of DANGEROUS_URL_PREFIXES) {
		if (trimmed === prefix || trimmed.startsWith(prefix)) {
			return "#";
		}
	}
	return url.trim();
}

function unixTime(ms: number | undefined): number {
	return ms ? Math.floor(ms / 1000) : Math.floor(Date.now() / 1000);
}

type BookmarkNode = chrome.bookmarks.BookmarkTreeNode;

function nodeHasBookmark(node: BookmarkNode | undefined): boolean {
	if (!node) return false;
	if (node.url) return true;
	if (!node.children || !node.children.length) return false;
	for (const child of node.children) {
		if (nodeHasBookmark(child)) {
			return true;
		}
	}
	return false;
}

function nodeToNetscapeHtml(node: BookmarkNode | undefined): string {
	if (!node) return "";
	if (node.url) {
		const addDate = unixTime(node.dateAdded);
		const modified = unixTime(node.dateGroupModified || node.dateAdded);
		const safeUrl = sanitizeBookmarkUrl(node.url);
		return `<DT><A HREF="${escapeHtml(safeUrl)}" ADD_DATE="${addDate}" LAST_MODIFIED="${modified}">${escapeHtml(node.title || "")}</A>\n`;
	}
	if (!nodeHasBookmark(node)) {
		return "";
	}
	const addDate = unixTime(node.dateGroupModified || node.dateAdded);
	let out = `<DT><H3 ADD_DATE="${addDate}"${node.children?.length ? "" : " FOLDED"}>${escapeHtml(node.title || "")}</H3>\n<DL><p>\n`;
	if (node.children?.length) {
		for (const child of node.children) {
			out += nodeToNetscapeHtml(child);
		}
	}
	out += "</DL><p>\n";
	return out;
}

function buildBookmarksHtml(tree: BookmarkNode[]): string {
	if (!Array.isArray(tree)) return "";
	const header = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     Do Not Edit! -->
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Bookmarks</title>
<h1>Bookmarks</h1>
<dl><p>
`;
	const topNodes: BookmarkNode[] = [];
	for (const root of tree) {
		if (root && root.children && root.children.length) {
			for (const node of root.children) {
				if (node.url || nodeHasBookmark(node)) {
					topNodes.push(node);
				}
			}
		}
	}
	let body = "";
	if (topNodes.length === 1 && topNodes[0] && !topNodes[0].url) {
		const folder = topNodes[0];
		if (folder.children && folder.children.length) {
			for (const child of folder.children) {
				if (child.url || nodeHasBookmark(child)) {
					body += nodeToNetscapeHtml(child);
				}
			}
		}
	} else {
		for (const node of topNodes) {
			body += nodeToNetscapeHtml(node);
		}
	}
	return header + body + "</dl><p>\n";
}

function nodeToMarkdown(node: BookmarkNode | undefined, depth: number): string {
	if (!node) return "";
	const indent = "  ".repeat(depth);
	if (node.url) {
		const safeUrl = sanitizeBookmarkUrl(node.url);
		const title = node.title || safeUrl || "";
		return `${indent}- [${escapeMarkdown(title)}](${escapeMarkdown(safeUrl)})\n`;
	}
	if (!nodeHasBookmark(node)) {
		return "";
	}
	const title = node.title || "";
	let out = `${indent}- ${escapeMarkdown(title)}\n`;
	if (node.children?.length) {
		for (const child of node.children) {
			out += nodeToMarkdown(child, depth + 1);
		}
	}
	return out;
}

function buildBookmarksMarkdown(tree: BookmarkNode[]): string {
	if (!Array.isArray(tree)) return "";
	const topNodes: BookmarkNode[] = [];
	for (const root of tree) {
		if (root && root.children && root.children.length) {
			for (const node of root.children) {
				if (node.url || nodeHasBookmark(node)) {
					topNodes.push(node);
				}
			}
		}
	}
	let body = "";
	if (topNodes.length === 1 && topNodes[0] && !topNodes[0].url) {
		const folder = topNodes[0];
		if (folder.children && folder.children.length) {
			for (const child of folder.children) {
				if (child.url || nodeHasBookmark(child)) {
					body += nodeToMarkdown(child, 0);
				}
			}
		}
	} else {
		for (const node of topNodes) {
			body += nodeToMarkdown(node, 0);
		}
	}
	return "# Bookmarks\n\n" + body;
}

type MessageResponse =
	| { ok: true; html?: string; markdown?: string }
	| { ok: false; error: string };

chrome.runtime.onMessage.addListener(
	(msg: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void): boolean => {
		if (typeof msg !== "string") {
			return false;
		}
		if (!sender || sender.id !== chrome.runtime.id) {
			sendResponse({ ok: false, error: "Unauthorized" });
			return false;
		}
		if (msg === "getBookmarksHtml") {
			(async () => {
				try {
					const tree = await chrome.bookmarks.getTree();
					const html = buildBookmarksHtml(tree);
					sendResponse({ ok: true, html });
				} catch (err) {
					const message = err instanceof Error ? err.message : String(err);
					sendResponse({ ok: false, error: message });
				}
			})();
			return true;
		}
		if (msg === "getBookmarksMarkdown") {
			(async () => {
				try {
					const tree = await chrome.bookmarks.getTree();
					const markdown = buildBookmarksMarkdown(tree);
					sendResponse({ ok: true, markdown });
				} catch (err) {
					const message = err instanceof Error ? err.message : String(err);
					sendResponse({ ok: false, error: message });
				}
			})();
			return true;
		}
		if (msg === "setIconState:exporting") {
			setIconState("exporting");
			sendResponse({ ok: true });
			return false;
		}
		if (msg === "setIconState:idle") {
			setIconState("idle");
			sendResponse({ ok: true });
			return false;
		}
		return false;
	},
);
