import { defineConfig, globalIgnores } from 'eslint/config';
import cypress from 'eslint-plugin-cypress';
import formatjs from 'eslint-plugin-formatjs';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores([
    '**/public/',
    '**/cypress/',
    '**/node_modules/',
    '**/.next/',
    '**/.github/',
    '**/dist/',
    '**/.vscode/',
    '**/coverage/',
    '**/*.log',
    '**/*.env*local',
    '**/*.tsbuildinfo',
    '**/*.d.ts',
    '**/*.js',
    '**/.next/',
    '**/out/',
  ]),
  {
    extends: compat.extends(
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:prettier/recommended',
      'next',
      'plugin:@typescript-eslint/recommended',
    ),

    plugins: {
      cypress,
      formatjs,
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 12,
        sourceType: 'module',
        tsconfigRootDir: __dirname,
      },
    },

    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },

      react: {
        version: 'detect',
      },
    },

    rules: {
      'prettier/prettier': [
        'error',
        {
          printWidth: 80,
          semi: true,
          trailingComma: 'all',
          singleQuote: true,
          proseWrap: 'always',
        },
      ],

      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      'typescript-eslint/no-require-imports': 'off',
    },
  },
]);
