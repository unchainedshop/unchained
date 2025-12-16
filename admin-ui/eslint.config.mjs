import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import prettierPlugin from 'eslint-plugin-prettier';
import cypressPlugin from 'eslint-plugin-cypress';
import formatjsPlugin from 'eslint-plugin-formatjs';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

export default [
  // Global ignores
  {
    ignores: [
      'public/',
      'cypress/',
      'node_modules/',
      '.next/',
      '.github/',
      'dist/',
      '.vscode/',
      'coverage/',
      '*.log',
      '*.env*local',
      '*.tsbuildinfo',
      '*.d.ts',
      'out/',
      // Root JS config files
      '*.config.js',
      '*.config.mjs',
      'generate-permissions.js',
      'custom-formatter.js',
      'extract-missing-translation-keys.js',
      'loadPermissionConfig.js',
      'possibleTypesGenerator.mjs',
      // JS files in src that should be ignored
      'src/lib/permissionConfig.js',
      'src/modules/assortment/utils/contructTangleLayout.js',
      'src/modules/common/utils/matomo.js',
    ],
  },

  // Base config for all files
  eslint.configs.recommended,

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: reactPlugin,
      prettier: prettierPlugin,
      cypress: cypressPlugin,
      formatjs: formatjsPlugin,
      '@next/next': nextPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      // Prettier
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

      // TypeScript
      ...tseslint.configs.recommended.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',

      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // Next.js
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-img-element': 'warn',
      '@next/next/no-sync-scripts': 'warn',
    },
  },
];
