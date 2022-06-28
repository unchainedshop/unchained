Package.describe({
  name: 'unchained:core-countries',
  version: '1.1.3',
  summary: 'Unchained Engine Core: Countries',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'emoji-flags': '1.3.0',
  'i18n-iso-countries': '6.4.0',
  'lru-cache': '7.7.0',
  'abort-controller': '3.0.0',
  'simpl-schema': '1.12.0',
  '@unchainedshop/utils': '1.1.3',
  // '@unchainedshop/events': '1.1.4', // PEER
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.mainModule('src/countries-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb@1.1.3');
  api.use('unchained:core-countries');

  api.mainModule('tests/countries-index.test.ts');
});
