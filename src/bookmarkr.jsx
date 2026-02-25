import { Component, useState, useEffect } from "react";
import React from "react";
import ReactDOM from "react-dom/client";
import {
	Box,
	Button,
	ChakraProvider,
	defaultSystem,
	Field,
	HStack,
	Icon,
	Menu,
	SegmentGroup,
	VStack,
} from "@chakra-ui/react";
import { LuChevronRight } from "react-icons/lu";

function t(key, subs) {
	return chrome.i18n.getMessage(key, subs) || key;
}

function GoogleIcon(props) {
	return (
		<Box as="span" display="inline-block" lineHeight="0" {...props}>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden focusable="false">
				<path fillRule="evenodd" clipRule="evenodd" d="M19.6 10.227C19.6 9.51801 19.536 8.83701 19.418 8.18201H10V12.05H15.382C15.2706 12.6619 15.0363 13.2448 14.6932 13.7635C14.3501 14.2822 13.9054 14.726 13.386 15.068V17.578H16.618C18.509 15.836 19.6 13.273 19.6 10.228V10.227Z" fill="#4285F4" />
				<path fillRule="evenodd" clipRule="evenodd" d="M9.99996 20C12.7 20 14.964 19.105 16.618 17.577L13.386 15.068C12.491 15.668 11.346 16.023 9.99996 16.023C7.39496 16.023 5.18996 14.263 4.40496 11.9H1.06396V14.49C1.89597 16.1468 3.17234 17.5395 4.7504 18.5126C6.32846 19.4856 8.14603 20.0006 9.99996 20Z" fill="#34A853" />
				<path fillRule="evenodd" clipRule="evenodd" d="M4.405 11.9C4.205 11.3 4.091 10.66 4.091 10C4.091 9.34001 4.205 8.70001 4.405 8.10001V5.51001H1.064C0.364015 6.90321 -0.000359433 8.44084 2.66054e-07 10C2.66054e-07 11.614 0.386 13.14 1.064 14.49L4.404 11.9H4.405Z" fill="#FBBC05" />
				<path fillRule="evenodd" clipRule="evenodd" d="M9.99996 3.977C11.468 3.977 12.786 4.482 13.823 5.473L16.691 2.605C14.959 0.99 12.695 0 9.99996 0C6.08996 0 2.70996 2.24 1.06396 5.51L4.40396 8.1C5.19196 5.736 7.39596 3.977 9.99996 3.977Z" fill="#EA4335" />
			</svg>
		</Box>
	);
}

const STORAGE_KEYS = { destination: "exportDestination" };
const GDRIVE_FOLDER_NAME = "Bookmarkr";

async function getDriveFolderId(token) {
	const listUrl = "https://www.googleapis.com/drive/v3/files?" + new URLSearchParams({
		q: "name='" + GDRIVE_FOLDER_NAME + "' and 'root' in parents and mimeType='application/vnd.google-apps.folder'",
		fields: "files(id)",
	}).toString();
	const listRes = await fetch(listUrl, {
		headers: { "Authorization": "Bearer " + token },
		method: "GET",
	});
	if (!listRes.ok) {
		const err = await listRes.text();
		throw new Error(err || String(listRes.status));
	}
	const listJson = await listRes.json();
	if (listJson.files?.length) {
		return listJson.files[0].id;
	}
	const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
		body: JSON.stringify({
			name: GDRIVE_FOLDER_NAME,
			mimeType: "application/vnd.google-apps.folder",
			parents: ["root"],
		}),
		headers: {
			"Authorization": "Bearer " + token,
			"Content-Type": "application/json",
		},
		method: "POST",
	});
	if (!createRes.ok) {
		const err = await createRes.text();
		throw new Error(err || String(createRes.status));
	}
	const createJson = await createRes.json();
	return createJson.id;
}

async function uploadToDrive(token, folderId, filename, htmlContent) {
	const boundary = "-------BookmarkrUpload-------";
	const meta = JSON.stringify({ name: filename, parents: [folderId] });
	const body =
		"--" + boundary + "\r\n" +
		"Content-Type: application/json; charset=UTF-8\r\n\r\n" +
		meta + "\r\n" +
		"--" + boundary + "\r\n" +
		"Content-Type: text/html; charset=UTF-8\r\n\r\n" +
		htmlContent + "\r\n" +
		"--" + boundary + "--\r\n";
	const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
		body,
		headers: {
			"Authorization": "Bearer " + token,
			"Content-Type": "multipart/related; boundary=" + boundary,
		},
		method: "POST",
	});
	if (!res.ok) {
		const err = await res.text();
		let msg = err;
		try {
			const j = JSON.parse(err);
			if (j?.error?.message) msg = j.error.message;
		} catch (_) {}
		throw new Error(msg || String(res.status));
	}
}

class PopupErrorBoundary extends Component {
	state = { hasError: false, error: null };

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, info) {
		console.error("Popup error:", error, info);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: 20, minWidth: 360, fontSize: 14, color: "var(--colors-red-500)" }}>
					Something went wrong. Try reloading the extension.
					{this.state.error && (
						<div style={{ marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
							{String(this.state.error.message)}
						</div>
					)}
				</div>
			);
		}
		return this.props.children;
	}
}

function getDriveToken(interactive) {
	return new Promise((resolve, reject) => {
		chrome.identity.getAuthToken({ interactive }, (token) => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message || t("signInCancelled")));
				return;
			}
			if (!token) {
				reject(new Error(t("signInCancelled")));
				return;
			}
			resolve(token);
		});
	});
}

function Bookmarkr() {
	const [exportLabel, setExportLabel] = useState(t("exportManually"));
	const [exporting, setExporting] = useState(false);
	const [destination, setDestination] = useState("local");
	const [driveSignedIn, setDriveSignedIn] = useState(false);
	const [driveSigningIn, setDriveSigningIn] = useState(false);

	useEffect(() => {
		document.title = t("extensionName");
		chrome.storage.sync.get([STORAGE_KEYS.destination], (data) => {
			const v = data[STORAGE_KEYS.destination];
			setDestination(v === "gdrive" ? "gdrive" : "local");
		});
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const updateIcon = () => {
			chrome.runtime.sendMessage(media.matches ? "setIconTheme:dark" : "setIconTheme:light");
		};
		updateIcon();
		media.addEventListener("change", updateIcon);
		return () => media.removeEventListener("change", updateIcon);
	}, []);

	// When Google Drive is selected, check if user is already signed in
	useEffect(() => {
		if (destination !== "gdrive") {
			setDriveSignedIn(false);
			return;
		}
		getDriveToken(false)
			.then(() => setDriveSignedIn(true))
			.catch(() => setDriveSignedIn(false));
	}, [destination]);

	const handleDestinationChange = (e) => {
		const value = e?.value ?? e?.detail?.value ?? "local";
		const v = value === "gdrive" ? "gdrive" : "local";
		setDestination(v);
		chrome.storage.sync.set({ [STORAGE_KEYS.destination]: v });
	};

	const handleDriveSignIn = async () => {
		setDriveSigningIn(true);
		try {
			await getDriveToken(true);
			await chrome.permissions.request({ origins: ["https://www.googleapis.com/*"] }).catch(() => false);
			setDriveSignedIn(true);
		} catch (_) {
			setDriveSignedIn(false);
		} finally {
			setDriveSigningIn(false);
		}
	};

	const handleDriveDisconnect = () => {
		getDriveToken(false).then((token) => {
			chrome.identity.removeCachedAuthToken({ token }, () => {
				setDriveSignedIn(false);
			});
		}).catch(() => setDriveSignedIn(false));
	};

	const getBookmarksHtmlContent = async () => {
		const res = await Promise.race([
			new Promise((resolve) => chrome.runtime.sendMessage("getBookmarksHtml", resolve)),
			new Promise((_, reject) => setTimeout(() => reject(new Error(t("errorNoResponse"))), 8000)),
		]);
		if (res === undefined) {
			throw new Error(t("errorNoResponse"));
		}
		if (!res?.ok) {
			throw new Error(res?.error || t("errorCouldNotGetBookmarks"));
		}
		return res.html;
	};

	const getBookmarksMarkdownContent = async () => {
		const res = await Promise.race([
			new Promise((resolve) => chrome.runtime.sendMessage("getBookmarksMarkdown", resolve)),
			new Promise((_, reject) => setTimeout(() => reject(new Error(t("errorNoResponse"))), 8000)),
		]);
		if (res === undefined) {
			throw new Error(t("errorNoResponse"));
		}
		if (!res?.ok) {
			throw new Error(res?.error || t("errorCouldNotGetBookmarks"));
		}
		return res.markdown;
	};

	const exportLocalHtml = async () => {
		setExporting(true);
		setExportLabel(t("exporting"));
		try {
			const html = await getBookmarksHtmlContent();

			const now = new Date();
			const filename = `bookmarks-${now.toISOString().slice(0, 10)}-${now.toISOString().slice(11, 19).replace(/:/g, "-")}.html`;

			const blob = new Blob([html], { type: "text/html;charset=utf-8" });
			const url = URL.createObjectURL(blob);
			chrome.downloads.download(
				{ url, filename, saveAs: false, conflictAction: "overwrite" },
				() => {
					URL.revokeObjectURL(url);
					const err = chrome.runtime.lastError;
					setExporting(false);
					setExportLabel(err ? t("exportFailedMessage", [err.message]) : t("exported"));
					setTimeout(() => setExportLabel(t("exportManually")), 3000);
				}
			);
		} catch (err) {
			setExporting(false);
			const msg = err?.message || t("exportFailed");
			setExportLabel(msg);
			setTimeout(() => setExportLabel(t("exportManually")), 3000);
		}
	};

	const exportLocalMarkdown = async () => {
		setExporting(true);
		setExportLabel(t("exporting"));
		try {
			const markdown = await getBookmarksMarkdownContent();

			const now = new Date();
			const filename = `bookmarks-${now.toISOString().slice(0, 10)}-${now.toISOString().slice(11, 19).replace(/:/g, "-")}.md`;

			const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
			const url = URL.createObjectURL(blob);
			chrome.downloads.download(
				{ url, filename, saveAs: false, conflictAction: "overwrite" },
				() => {
					URL.revokeObjectURL(url);
					const err = chrome.runtime.lastError;
					setExporting(false);
					setExportLabel(err ? t("exportFailedMessage", [err.message]) : t("exported"));
					setTimeout(() => setExportLabel(t("exportManually")), 3000);
				}
			);
		} catch (err) {
			setExporting(false);
			const msg = err?.message || t("exportFailed");
			setExportLabel(msg);
			setTimeout(() => setExportLabel(t("exportManually")), 3000);
		}
	};

	const exportDriveHtml = async () => {
		setExporting(true);
		setExportLabel(t("exporting"));
		try {
			const html = await getBookmarksHtmlContent();

			const now = new Date();
			const filename = `bookmarks-${now.toISOString().slice(0, 10)}-${now.toISOString().slice(11, 19).replace(/:/g, "-")}.html`;

			const token = await getDriveToken(false);
			const granted = await chrome.permissions.request({ origins: ["https://www.googleapis.com/*"] }).catch(() => false);
			if (!granted) {
				setExporting(false);
				setExportLabel(t("uploadFailedMessage", [t("permissionDenied")]));
				setTimeout(() => setExportLabel(t("exportManually")), 3000);
				return;
			}

			const folderId = await getDriveFolderId(token);
			await uploadToDrive(token, folderId, filename, html);

			setExporting(false);
			setExportLabel(t("exported"));
			setTimeout(() => setExportLabel(t("exportManually")), 3000);
		} catch (err) {
			setExporting(false);
			const msg = err?.message || t("uploadFailed");
			setExportLabel(t("uploadFailedMessage", [msg]));
			setTimeout(() => setExportLabel(t("exportManually")), 3000);
		}
	};

	const handleExport = async () => {
		if (destination === "gdrive") {
			await exportDriveHtml();
		} else {
			await exportLocalHtml();
		}
	};

	const boxRef = React.useRef(null);
	useEffect(() => {
		if (!boxRef.current || typeof document === "undefined") return;
		const s = getComputedStyle(boxRef.current);
		document.body.style.backgroundColor = s.backgroundColor;
		document.body.style.color = s.color;
	}, []);

	return (
		<Box bg="bg" color="fg" minH="100%" minW="360px" p="5" ref={boxRef}>
			<VStack gap="4" align="stretch">
				<Field.Root>
					<Field.Label>{t("exportDestinationLabel")}</Field.Label>
					<SegmentGroup.Root
						minW="0"
						onValueChange={handleDestinationChange}
						value={destination}
						width="100%"
					>
						<SegmentGroup.Indicator />
						<SegmentGroup.Item value="local" width="100%">
							<SegmentGroup.ItemText>
								{t("exportDestinationLocal")}
							</SegmentGroup.ItemText>
							<SegmentGroup.ItemHiddenInput />
						</SegmentGroup.Item>
						<SegmentGroup.Item value="gdrive" width="100%">
							<SegmentGroup.ItemText>
								{t("exportDestinationGDrive")}
							</SegmentGroup.ItemText>
							<SegmentGroup.ItemHiddenInput />
						</SegmentGroup.Item>
					</SegmentGroup.Root>
				</Field.Root>

				{destination === "gdrive" && (
					<VStack gap="2" width="100%">
						{!driveSignedIn && (
							<Box fontSize="sm" color="fg.muted">
								{t("gdriveExportHint")}
							</Box>
						)}
						{driveSignedIn ? (
							<Button
								colorPalette="gray"
								onClick={handleDriveDisconnect}
								size="sm"
								variant="outline"
								width="100%"
							>
								{t("gdriveDisconnect")}
							</Button>
						) : (
							<Button
								colorPalette="blue"
								disabled={driveSigningIn}
								onClick={handleDriveSignIn}
								size="sm"
								variant="outline"
								width="100%"
							>
								<HStack gap="2">
									{driveSigningIn ? "…" : (
										<>
											<GoogleIcon />
											{t("gdriveSignIn")}
										</>
									)}
								</HStack>
							</Button>
						)}
					</VStack>
				)}

				{destination === "local" ? (
					<Menu.Root>
						<Menu.Trigger asChild>
							<Button
								colorPalette="blue"
								disabled={exporting}
								size="xl"
								w="full"
							>
								<HStack gap="2" justify="space-between" w="full">
									{exportLabel}
									<Icon size="sm">
										<LuChevronRight />
									</Icon>
								</HStack>
							</Button>
						</Menu.Trigger>
						<Menu.Positioner>
							<Menu.Content>
								<Menu.Item value="html" onSelect={exportLocalHtml}>
									{t("exportAsHtml")}
								</Menu.Item>
								<Menu.Item value="markdown" onSelect={exportLocalMarkdown}>
									{t("exportAsMarkdown")}
								</Menu.Item>
							</Menu.Content>
						</Menu.Positioner>
					</Menu.Root>
				) : (
					<Button
						colorPalette="blue"
						disabled={exporting || !driveSignedIn}
						onClick={handleExport}
						size="xl"
						w="full"
					>
						<HStack gap="2" justify="space-between" w="full">
							{exportLabel}
							<Icon size="sm">
								<LuChevronRight />
							</Icon>
						</HStack>
					</Button>
				)}
			</VStack>
		</Box>
	);
}

export { Bookmarkr };

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<PopupErrorBoundary>
			<div className="dark">
				<ChakraProvider value={defaultSystem}>
					<Bookmarkr />
				</ChakraProvider>
			</div>
		</PopupErrorBoundary>
	</React.StrictMode>
);
