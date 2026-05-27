import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ["**/*.{js,jsx,ts,tsx}"],
		languageOptions: {
			ecmaVersion: "latest",
			globals: { ...globals.browser, chrome: "readonly" },
			parserOptions: {
				ecmaFeatures: { jsx: true },
			},
		},
		plugins: {
			react,
			"react-hooks": reactHooks,
			"react-refresh": reactRefresh,
		},
		rules: {
			...react.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			"react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
			"react/jsx-uses-react": "off",
			"react/react-in-jsx-scope": "off",
		},
		settings: {
			react: { version: "detect" },
		},
	},
	{
		files: ["scripts/**/*.{js,ts}"],
		languageOptions: {
			globals: { ...globals.node },
		},
	},
	{
		ignores: ["build/", "node_modules/", "icons/*.png", "*.config.js", "*.config.ts"],
	},
);
