Package.describe({
  name: 'unchained:core-worker',
  version: '1.1.1',
  summary: 'Unchained Engine Core: Worker',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  later: '1.2.0',
  'simpl-schema': '1.12.0',
  '@unchainedshop/logger': '1.1.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.1.0');

  api.mainModule('src/worker-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb');
  api.use('unchained:core-worker');

  api.mainModule('tests/worker-index.test.ts');
});
