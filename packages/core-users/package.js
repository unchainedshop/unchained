Package.describe({
  name: 'unchained:core-users',
  version: '1.1.3',
  summary: 'Unchained Engine Core: Users',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  locale: '0.1.0',
  uuid: '7.0.1',
  'simpl-schema': '1.12.0',
  '@unchainedshop/logger': '1.1.3',
  '@unchainedshop/roles': '1.1.3',
  '@unchainedshop/utils': '1.1.3',
  '@unchainedshop/events': '1.1.4',
  '@unchainedshop/file-upload': '1.1.4',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.mainModule('src/users-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb@1.1.3');
  api.use('unchained:core-users@1.1.3');

  api.mainModule('tests/users-index.test.ts');
});
