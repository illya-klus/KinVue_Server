// @ts-check

import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/generated/**",
      "doc/archive/**",
      "**/migrations/snapshots/**",
      "**/prisma/contract.d.ts",
    ],
  },

  {
    files: ["**/*.{js,mjs,cjs,ts}"],

    extends: [js.configs.recommended, tseslint.configs.recommended, prettier],

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },

    rules: {
      "@typescript-eslint/no-explicit-any": "warn",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },

  {
    files: ["**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["**/test/**/*.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
