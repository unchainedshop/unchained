Package.describe({
  name: 'unchained:core-filters',
  version: '1.1.0',
  summary: 'Unchained Engine Core: Filters',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'simpl-schema': '1.12.0',
  '@unchainedshop/logger': '1.1.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.1.0');
  api.use('unchained:events@1.1.0');

  api.mainModule('src/filters-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:core-filters');
  api.use('unchained:mongodb');
  api.use('unchained:core-products');

  api.mainModule('tests/filters-index.test.ts');
});
