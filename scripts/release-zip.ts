/**
 * Builds the extension and creates a zip for distribution (e.g. GitHub Releases).
 * Output: bookmarkr-<version>.zip with manifest, build/ (popup + service worker), icons/, _locales/.
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import archiver from "archiver";

interface Manifest {
	version?: string;
	[key: string]: unknown;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8")) as Manifest;
const version = manifest.version || "0.0.0";
const zipName = `bookmarkr-${version}.zip`;
const zipPath = path.join(root, zipName);

execSync("npm run build", { cwd: root, stdio: "inherit" });

const output = fs.createWriteStream(zipPath);
const archive = archiver("zip", { zlib: { level: 9 } });

const done = new Promise<void>((resolve, reject) => {
	output.on("close", () => {
		console.log(`Created ${zipName} (${Math.round(archive.pointer() / 1024)} KB)`);
		resolve();
	});
	archive.on("error", reject);
	output.on("error", reject);
});

archive.pipe(output);

const files: readonly string[] = ["manifest.json"];
for (const f of files) {
	const full = path.join(root, f);
	if (fs.existsSync(full)) {
		archive.file(full, { name: f });
	}
}

const dirs: readonly string[] = ["build", "icons", "_locales"];
for (const d of dirs) {
	const full = path.join(root, d);
	if (fs.existsSync(full)) {
		archive.directory(full, d);
	}
}

archive.finalize();
await done;
