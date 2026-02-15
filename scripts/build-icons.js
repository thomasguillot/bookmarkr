import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sizes = [16, 48, 128];
const svgPath = path.join(__dirname, "..", "icons", "icon.svg");
const svg = fs.readFileSync(svgPath);

async function build() {
	for (const size of sizes) {
		const outPath = path.join(__dirname, "..", "icons", `icon${size}.png`);
		await sharp(svg)
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
