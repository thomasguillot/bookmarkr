import { useState, useEffect } from "react";
import React from "react";
import ReactDOM from "react-dom/client";
import {
	Box,
	Button,
	ChakraProvider,
	defaultSystem,
	Field,
	Switch,
	VStack,
} from "@chakra-ui/react";

function t(key, subs) {
	return chrome.i18n.getMessage(key, subs) || key;
}

function Bookmarkr() {
	const [exportLabel, setExportLabel] = useState(t("exportManually"));
	const [exporting, setExporting] = useState(false);
	const [autoExport, setAutoExport] = useState(true);

	useEffect(() => {
		document.title = t("extensionName");
		chrome.storage.sync.get("autoExport", (data) => {
			setAutoExport(data.autoExport !== false);
		});
	}, []);

	const handleAutoExportChange = (e) => {
		const checked = e.checked;
		setAutoExport(checked);
		chrome.storage.sync.set({ autoExport: checked });
	};

	const handleExport = async () => {
		setExporting(true);
		setExportLabel(t("exporting"));
		try {
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
			const blob = new Blob([res.html], { type: "text/html;charset=utf-8" });
			const url = URL.createObjectURL(blob);
			const now = new Date();
			const filename = `bookmarks-${now.toISOString().slice(0, 10)}-${now.toISOString().slice(11, 19).replace(/:/g, "-")}.html`;
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
			setExportLabel(err?.message ? err.message : t("exportFailed"));
			setTimeout(() => setExportLabel(t("exportManually")), 3000);
		}
	};

	return (
		<Box bg="bg" minH="100%" minW="280px" p="5">
			<VStack gap="4" align="stretch">
				<Field.Root>
					<Switch.Root
						checked={autoExport}
						onCheckedChange={handleAutoExportChange}
						colorPalette="gray"
					>
						<Switch.HiddenInput />
						<Switch.Control />
						<Switch.Label>{t("autoExport")}</Switch.Label>
					</Switch.Root>
					<Field.HelperText>
						{t("autoExportHelp")}
					</Field.HelperText>
				</Field.Root>
				<Button
					w="full"
					variant="subtle"
					colorPalette="gray"
					onClick={handleExport}
					disabled={exporting}
				>
					{exportLabel}
				</Button>
			</VStack>
		</Box>
	);
}

export { Bookmarkr };

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<div className="dark">
			<ChakraProvider value={defaultSystem}>
				<Bookmarkr />
			</ChakraProvider>
		</div>
	</React.StrictMode>
);
