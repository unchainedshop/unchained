Package.describe({
  name: 'unchained:core-mongodb',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine Core: MongoDB',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lodash.isempty': '4.4.0',
  'lodash.isequal': '4.5.0',
  'lodash.isobject': '3.0.2',
  'simpl-schema': '1.12.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('mongo');
  api.use('promise');
  api.use('ejson');
  api.use('ecmascript');
  api.use('raix:eventemitter');
  api.use('typescript@4.1.2');

  api.mainModule('src/mongodb-index.js');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript@4.1.2');

  api.use('unchained:core-mongodb@1.0.0-beta15');

  api.mainModule('test/mongodb-index.tests.js');
});