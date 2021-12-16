Package.describe({
  name: 'unchained:core-users',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine Core: Users',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  locale: '0.1.0',
  uuid: '7.0.1',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.0.0-beta15');
  api.use('unchained:logger@1.0.0-beta15');

  api.use('unchained:core-files-next@1.0.0-beta15');

  api.mainModule('src/users-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb@1.0.0-beta15');
  api.use('unchained:core-users@1.0.0-beta15');

  api.mainModule('tests/users-index.test.ts');
});
