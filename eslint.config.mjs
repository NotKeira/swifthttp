import {defineConfig, globalIgnores} from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-plugin-prettier";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import {fileURLToPath} from "node:url";
import js from "@eslint/js";
import {FlatCompat} from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores([
    "**/dist",
    "**/node_modules",
    "**/coverage",
    "**/*.js",
    "**/node_modules/",
    "**/dist/",
    "**/coverage/",
    "**/*.config.js",
    "**/*.config.ts",
    "**/vitest.config.ts",
    "**/*.test.ts",
    "**/*.spec.ts",
]),
    {
    extends: compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier"
    ),

    plugins: {
        "@typescript-eslint": typescriptEslint,
        prettier
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 2020,
        sourceType: "module",

        parserOptions: {
            project: "./tsconfig.json",
        },
    },

    rules: {
        "prettier/prettier": "error",
        yoda: ["error", "never"],
        "no-console": "warn",
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/no-explicit-any": "error",

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
        }],

        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-promises": "error",
        "@typescript-eslint/await-thenable": "error",
        "@typescript-eslint/prefer-nullish-coalescing": "error",
        "@typescript-eslint/prefer-optional-chain": "error",

        "@typescript-eslint/consistent-type-imports": ["error", {
            prefer: "type-imports",
        }],

        "prefer-const": "error",
        "no-var": "error",
        eqeqeq: ["error", "always"],
        curly: ["error", "all"],
        "brace-style": ["error", "1tbs"],
    },
}]);