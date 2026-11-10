// @ts-check

import { globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import eslintPluginPrettierConfig from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.stylistic,
  eslintPluginPrettierConfig,
  globalIgnores([
    '.git',
    '.aider*',
    '.context/',
    'node_modules/',
    'examples/',
    './docs/',
    '**/lib/',
    './admin-ui',
  ]),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // `await using lock = ...` bindings exist to be disposed, not to be read.
      '@typescript-eslint/no-unused-vars': ['error', { ignoreUsingDeclarations: true }],
      'prettier/prettier': [
        'error',
        {
          printWidth: 105,
          semi: true,
          trailingComma: 'all',
          singleQuote: true,
          proseWrap: 'always',
        },
      ],
    },
    languageOptions: {
      globals: globals.node,
    },
  },
);
