Package.describe({
  name: 'unchained:core-bookmarks',
  version: '1.0.0-beta14',
  summary: 'Unchained Engine Core: Warehousing',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'simpl-schema': '1.12.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('promise');
  api.use('typescript@4.1.2');

  api.mainModule('lib/bookmarks-index.js', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript@4.1.2');

  api.use('unchained:core-mongodb@1.0.0-beta14');
  api.use('unchained:core-bookmarks@1.0.0-beta14');

  api.mainModule('test/bookmarks-index.test.js');
});
