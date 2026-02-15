import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	base: "./",
	root: path.resolve("src"),
	publicDir: false,
	build: {
		outDir: path.resolve("build"),
		emptyOutDir: true,
		rollupOptions: {
			input: path.resolve("src", "bookmarkr.html"),
		},
	},
});
