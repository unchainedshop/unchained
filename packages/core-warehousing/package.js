Package.describe({
  name: 'unchained:core-warehousing',
  version: '1.1.3',
  summary: 'Unchained Engine Core: Warehousing',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  '@unchainedshop/logger': '1.1.3',
  '@unchainedshop/utils': '1.1.3',
  '@unchainedshop/events': '1.1.4',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.mainModule('src/warehousing-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb');
  api.use('unchained:core-warehousing');

  api.mainModule('tests/warehousing-index.test.ts');
});
