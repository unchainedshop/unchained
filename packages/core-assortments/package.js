Package.describe({
  name: 'unchained:core-assortments',
  version: '1.1.4',
  summary: 'Unchained Engine Core: Assortments',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  locale: '0.1.0',
  ramda: '0.27.1',
  'simpl-schema': '1.12.0',
  '@unchainedshop/logger': '1.1.3',
  '@unchainedshop/utils': '1.1.3',
  // '@unchainedshop/events': '1.1.4', // PEER!
  // '@unchainedshop/file-upload': '1.1.4', // PEER!
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.mainModule('src/assortments-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb');
  api.use('unchained:core-assortments');

  api.mainModule('tests/assortments-index.test.ts');
});
