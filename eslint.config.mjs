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
  globalIgnores(['.git', '.aider*', 'node_modules/', 'examples/', './docs/', '**/lib/', './admin-ui']),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
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
