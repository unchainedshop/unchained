Package.describe({
  name: 'unchained:core-accountsjs',
  version: '0.52.0',
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
  'lodash.defer': '4.1.0',
});

Package.onUse((api) => {
  api.versionsFrom('1.10.2');
  api.use('ecmascript');
  api.mainModule('core-accountsjs.js');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('unchained:core-accountsjs');
  api.mainModule('core-accountsjs-tests.js');
});
