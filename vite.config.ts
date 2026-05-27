import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	base: "./",
	root: path.resolve("src"),
	publicDir: false,
	resolve: {
		alias: {
			"@": path.resolve("src"),
		},
	},
	build: {
		outDir: path.resolve("build"),
		emptyOutDir: true,
		rollupOptions: {
			input: {
				popup: path.resolve("src", "bookmarkr.html"),
				"service-worker": path.resolve("src", "service-worker.ts"),
			},
			output: {
				entryFileNames: (chunk) =>
					chunk.name === "service-worker" ? "service-worker.js" : "assets/[name]-[hash].js",
			},
		},
	},
});
