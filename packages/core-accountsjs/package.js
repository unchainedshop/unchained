Package.describe({
  name: 'unchained:core-accountsjs',
  version: '0.60.0',
  summary: 'Unchained Engine Core: Accounts',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  '@accounts/database-manager': '0.29.0',
  '@accounts/mongo': '0.29.0',
  '@accounts/password': '0.29.0',
  '@accounts/server': '0.29.0',
  '@graphql-modules/core': '0.7.17',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');
  api.use('ecmascript');
  api.mainModule('index.js');
});
