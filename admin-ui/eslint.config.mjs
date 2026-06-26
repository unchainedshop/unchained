import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
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
      'client/dist/',
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
      'custom-formatter.cjs',
      'extract-missing-translation-keys.cjs',
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
      prettier: prettierPlugin,
      cypress: cypressPlugin,
      formatjs: formatjsPlugin,
      '@next/next': nextPlugin,
    },
    settings: {},
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

      // Next.js
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-img-element': 'warn',
      '@next/next/no-sync-scripts': 'warn',

      // Prevent importing moved primitives from old locations
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/common/components/Button'],
              message: 'Use @/components/ui/Button',
            },
            {
              group: ['**/common/components/Badge'],
              message: 'Use @/components/ui/Badge',
            },
            {
              group: ['**/common/components/Toggle'],
              message: 'Use @/components/ui/Toggle',
            },
            {
              group: ['**/common/components/Loading'],
              message: 'Use @/components/ui/Loading',
            },
            {
              group: ['**/common/components/NoData'],
              message: 'Use @/components/ui/NoData',
            },
            {
              group: ['**/common/components/BlockingContent'],
              message: 'Use @/components/ui/BlockingContent',
            },
            {
              group: ['**/common/components/SearchField'],
              message: 'Use @/components/ui/SearchField',
            },
            {
              group: ['**/common/components/CopyableText'],
              message: 'Use @/components/ui/CopyableText',
            },
            {
              group: ['**/common/components/Tab'],
              message: 'Use @/components/ui/Tab',
            },
            {
              group: ['**/common/components/BreadCrumbs'],
              message: 'Use @/components/ui/BreadCrumbs',
            },
            {
              group: ['**/common/components/PageHeader'],
              message: 'Use @/components/ui/PageHeader',
            },
            {
              group: ['**/common/components/ListHeader'],
              message: 'Use @/components/ui/ListHeader',
            },
            {
              group: ['**/common/components/DetailHeader'],
              message: 'Use @/components/ui/DetailHeader',
            },
            {
              group: ['**/common/components/JSONView'],
              message: 'Use @/components/ui/JSONView',
            },
            {
              group: ['**/common/components/Pagination'],
              message: 'Use @/components/ui/Pagination',
            },
            {
              group: ['**/common/components/ToolTip'],
              message: 'Use @/components/ui/ToolTip',
            },
            {
              group: ['**/common/components/ErrorBoundary'],
              message: 'Use @/components/ui/ErrorBoundary',
            },
            {
              group: ['**/common/components/ErrorFallback'],
              message: 'Use @/components/ui/ErrorFallback',
            },
            {
              group: ['**/common/components/DateInput'],
              message: 'Use @/components/ui/DateInput',
            },
            {
              group: ['**/common/components/DateRangeFilterInput'],
              message: 'Use @/components/ui/DateRangeFilterInput',
            },
            {
              group: ['**/common/components/AnimatedCounter'],
              message: 'Use @/components/ui/AnimatedCounter',
            },
            {
              group: ['**/common/components/HelpText'],
              message: 'Use @/components/ui/HelpText',
            },
            {
              group: ['**/common/components/InfoTextBanner'],
              message: 'Use @/components/ui/InfoTextBanner',
            },
            {
              group: ['**/common/components/SaveAndCancelButtons'],
              message: 'Use @/components/ui/SaveAndCancelButtons',
            },
            {
              group: ['**/common/components/ActiveInActive'],
              message: 'Use @/components/ui/ActiveInActive',
            },
            {
              group: ['**/common/components/ImageWithFallback'],
              message: 'Use @/components/ui/ImageWithFallback',
            },
            {
              group: ['**/common/components/NoImage'],
              message: 'Use @/components/ui/NoImage',
            },
            {
              group: ['**/common/components/DraggableIcon'],
              message: 'Use @/components/ui/DraggableIcon',
            },
            {
              group: ['**/common/components/Accordion*'],
              message: 'Use @/components/ui/Accordion/*',
            },
            {
              group: ['**/common/components/TagInput', '**/common/components/TagList*'],
              message: 'Use @/components/ui/Tag/*',
            },
            {
              group: ['**/common/components/Portal*'],
              message: 'Use @/components/ui/Portal/*',
            },
            {
              group: ['**/forms/components/TextField', '**/forms/components/TextAreaField', '**/forms/components/SelectField', '**/forms/components/CheckboxField', '**/forms/components/ChoicesField', '**/forms/components/DatePickerField', '**/forms/components/EmailField', '**/forms/components/PasswordField', '**/forms/components/JSONAreaField', '**/forms/components/MarkdownTextAreaField', '**/forms/components/TagInputField', '**/forms/components/FieldWrapper', '**/forms/components/FormErrors', '**/forms/components/SubmitButton', '**/forms/components/FieldWithHelp'],
              message: 'Use @/components/ui/form/*',
            },
            {
              group: ['**/common/components/DeleteButton', '**/common/components/HeaderDeleteButton', '**/common/components/EditIcon'],
              message: 'Deleted — use <Button> from @/components/ui/Button with appropriate variant/icon',
            },
          ],
          paths: [
            {
              name: 'classnames',
              message: 'Use clsx instead of classnames',
            },
          ],
        },
      ],
    },
  },
];
