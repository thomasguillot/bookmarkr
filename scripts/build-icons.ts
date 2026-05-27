import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sizes: readonly number[] = [16, 48, 128];
const iconsDir = path.join(__dirname, "..", "icons");
const svgPath = path.join(iconsDir, "icon.svg");

function roundedMaskSvg(size: number, radius: number): Buffer {
	return Buffer.from(
		[
			'<svg xmlns="http://www.w3.org/2000/svg" width="',
			size,
			'" height="',
			size,
			'">',
			'<rect x="0" y="0" width="',
			size,
			'" height="',
			size,
			'" rx="',
			radius,
			'" ry="',
			radius,
			'" fill="#ffffff"/>',
			"</svg>",
		].join(""),
	);
}

async function generateBaseIcon(size: number, svg: string): Promise<void> {
	const outPath = path.join(iconsDir, `icon${size}.png`);
	await sharp(Buffer.from(svg, "utf8"))
		.resize(size, size, { fit: "contain" })
		.png()
		.toFile(outPath);
	console.log(`Wrote ${outPath}`);
}

async function generateExportIcon(size: number, svg: string): Promise<void> {
	const padding = Math.round(size * 0.18);
	const radius = Math.round(size * 0.18);

	const base = sharp({
		create: {
			width: size,
			height: size,
			channels: 4,
			background: { r: 255, g: 255, b: 255, alpha: 1 },
		},
	});

	const iconBuffer = await sharp(Buffer.from(svg, "utf8"))
		.resize(size - padding * 2, size - padding * 2, {
			fit: "contain",
		})
		.toBuffer();

	const mask = roundedMaskSvg(size, radius);

	const output = await base
		.composite([
			{ input: iconBuffer, gravity: "center" },
			{ input: mask, blend: "dest-in" },
		])
		.png()
		.toBuffer();

	const outputPath = path.join(iconsDir, `icon${size}-export.png`);
	await fs.promises.writeFile(outputPath, output);
	console.log(`Wrote ${outputPath}`);
}

async function build(): Promise<void> {
	const svg = fs.readFileSync(svgPath, "utf8");

	for (const size of sizes) {
		await generateBaseIcon(size, svg);
		await generateExportIcon(size, svg);
	}
}

build().catch((err) => {
	console.error(err);
	process.exit(1);
});
