// @ts-check

import { globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from "globals";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  globalIgnores([
    '.git',
    '.aider*',
    'node_modules/',
    'examples/',
    './docs/',
    '**/lib/',
]),
  {
    rules: {
        "@typescript-eslint/no-explicit-any": "off",
        // "prettier/prettier": [
        //     "error",
        //     {
        //         "printWidth": 105,
        //         "semi": true,
        //         "trailingComma": "all",
        //         "singleQuote": true,
        //         "proseWrap": "always",
        //     },
        // ],
    },
    languageOptions: {
        ecmaVersion: 2024,
        globals: globals.node,
    },
  }
);