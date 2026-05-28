import { Component, useEffect, useState, type ReactNode } from "react";
import React from "react";
import ReactDOM from "react-dom/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

interface BookmarksHtmlResponse {
	ok: boolean;
	html?: string;
	error?: string;
}

interface BookmarksMarkdownResponse {
	ok: boolean;
	markdown?: string;
	error?: string;
}

function t(key: string, subs?: string[]): string {
	return chrome.i18n.getMessage(key, subs) || key;
}

interface PopupErrorBoundaryProps {
	children: ReactNode;
}

interface PopupErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

class PopupErrorBoundary extends Component<PopupErrorBoundaryProps, PopupErrorBoundaryState> {
	override state: PopupErrorBoundaryState = { hasError: false, error: null };

	static getDerivedStateFromError(error: Error): PopupErrorBoundaryState {
		return { hasError: true, error };
	}

	override componentDidCatch(error: Error, info: React.ErrorInfo): void {
		console.error("Popup error:", error, info);
	}

	override render(): ReactNode {
		if (this.state.hasError) {
			return (
				<div className="min-w-[360px] p-5 text-sm text-destructive">
					Something went wrong. Try reloading the extension.
					{this.state.error && (
						<div className="mt-2 text-xs whitespace-pre-wrap break-all">
							{String(this.state.error.message)}
						</div>
					)}
				</div>
			);
		}
		return this.props.children;
	}
}

function BookmarkrIcon({ className }: { className?: string }): React.ReactElement {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
			<path d="m9 10 2 2 4-4" />
		</svg>
	);
}

function timestampedFilename(extension: "html" | "md"): string {
	const iso = new Date().toISOString();
	return `bookmarks-${iso.slice(0, 10)}-${iso.slice(11, 19).replace(/:/g, "-")}.${extension}`;
}

function Bookmarkr(): React.ReactElement {
	const [exporting, setExporting] = useState<boolean>(false);

	useEffect(() => {
		document.title = t("extensionName");
	}, []);

	const getBookmarksHtmlContent = async (): Promise<string> => {
		const res = await Promise.race<BookmarksHtmlResponse | undefined>([
			new Promise<BookmarksHtmlResponse | undefined>((resolve) =>
				chrome.runtime.sendMessage("getBookmarksHtml", resolve),
			),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error(t("errorNoResponse"))), 8000),
			),
		]);
		if (res === undefined) {
			throw new Error(t("errorNoResponse"));
		}
		if (!res.ok || !res.html) {
			throw new Error(res.error || t("errorCouldNotGetBookmarks"));
		}
		return res.html;
	};

	const getBookmarksMarkdownContent = async (): Promise<string> => {
		const res = await Promise.race<BookmarksMarkdownResponse | undefined>([
			new Promise<BookmarksMarkdownResponse | undefined>((resolve) =>
				chrome.runtime.sendMessage("getBookmarksMarkdown", resolve),
			),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error(t("errorNoResponse"))), 8000),
			),
		]);
		if (res === undefined) {
			throw new Error(t("errorNoResponse"));
		}
		if (!res.ok || !res.markdown) {
			throw new Error(res.error || t("errorCouldNotGetBookmarks"));
		}
		return res.markdown;
	};

	const downloadBlob = (filename: string, blob: Blob, toastId: string | number): void => {
		const url = URL.createObjectURL(blob);
		chrome.downloads.download(
			{ url, filename, saveAs: false, conflictAction: "overwrite" },
			() => {
				URL.revokeObjectURL(url);
				const err = chrome.runtime.lastError;
				setExporting(false);
				if (err) {
					toast.error(t("exportFailedMessage", [err.message ?? ""]), { id: toastId });
				} else {
					toast.success(t("exported"), { id: toastId });
				}
				chrome.runtime.sendMessage("setIconState:idle");
			},
		);
	};

	const exportLocalHtml = async (): Promise<void> => {
		setExporting(true);
		const toastId = toast.loading(t("exporting"));
		chrome.runtime.sendMessage("setIconState:exporting");
		try {
			const html = await getBookmarksHtmlContent();
			const blob = new Blob([html], { type: "text/html;charset=utf-8" });
			downloadBlob(timestampedFilename("html"), blob, toastId);
		} catch (err) {
			setExporting(false);
			const msg = err instanceof Error ? err.message : t("exportFailed");
			toast.error(msg, { id: toastId });
			chrome.runtime.sendMessage("setIconState:idle");
		}
	};

	const exportLocalMarkdown = async (): Promise<void> => {
		setExporting(true);
		const toastId = toast.loading(t("exporting"));
		chrome.runtime.sendMessage("setIconState:exporting");
		try {
			const markdown = await getBookmarksMarkdownContent();
			const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
			downloadBlob(timestampedFilename("md"), blob, toastId);
		} catch (err) {
			setExporting(false);
			const msg = err instanceof Error ? err.message : t("exportFailed");
			toast.error(msg, { id: toastId });
			chrome.runtime.sendMessage("setIconState:idle");
		}
	};

	return (
		<div className="min-w-[360px] min-h-full p-6 bg-background text-foreground">
			<div className="flex flex-col gap-6">
				<div className="flex flex-col items-center gap-2">
					<BookmarkrIcon className="size-10" />
					<h1 className="text-xl font-semibold">{t("extensionName")}</h1>
				</div>
				<div className="flex flex-col gap-2">
					<Button
						className="w-full"
						disabled={exporting}
						onClick={exportLocalHtml}
					>
						{t("exportAsHtml")}
					</Button>
					<Button
						className="w-full"
						disabled={exporting}
						onClick={exportLocalMarkdown}
					>
						{t("exportAsMarkdown")}
					</Button>
				</div>
			</div>
		</div>
	);
}

export { Bookmarkr };

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Missing #root element");
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<PopupErrorBoundary>
			<Toaster position="top-center" richColors />
			<Bookmarkr />
		</PopupErrorBoundary>
	</React.StrictMode>,
);
