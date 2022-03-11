Package.describe({
  name: 'unchained:core-accountsjs',
  version: '1.0.0-rc.7',
  summary: 'Unchained Engine Core: Accounts',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  '@accounts/database-manager': '0.33.1',
  '@accounts/mongo': '0.33.5',
  '@accounts/password': '0.32.1',
  '@accounts/server': '0.33.1',
  '@graphql-modules/core': '0.7.17',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');

  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.0.0-rc.7');
  api.use('unchained:core-worker@1.0.0-rc.7');

  api.mainModule('src/accounts-index.ts');
});
