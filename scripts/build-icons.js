import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, "..", "icons");
const svgPath = path.join(iconsDir, "icon.svg");
let svg = fs.readFileSync(svgPath, "utf8");

async function build() {
	// Remove old non-suffixed icons if present
	for (const size of sizes) {
		const oldPath = path.join(iconsDir, `icon${size}.png`);
		if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
	}
	// Dark (black) icons – for light mode toolbar
	for (const size of sizes) {
		const outPath = path.join(__dirname, "..", "icons", `icon${size}-dark.png`);
		await sharp(Buffer.from(svg, "utf8"))
			.resize(size, size)
			.png()
			.toFile(outPath);
		console.log(`Wrote ${outPath}`);
	}
	// Light (white) icons – for dark mode toolbar
	const svgLight = svg.replace(/currentColor/g, "#ffffff");
	for (const size of sizes) {
		const outPath = path.join(__dirname, "..", "icons", `icon${size}-light.png`);
		await sharp(Buffer.from(svgLight, "utf8"))
			.resize(size, size)
			.png()
			.toFile(outPath);
		console.log(`Wrote ${outPath}`);
	}
}

build().catch((err) => {
	console.error(err);
	process.exit(1);
});
