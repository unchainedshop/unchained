Package.describe({
  name: 'unchained:core-bookmarks',
  version: '1.0.0-beta15',
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

  api.use('unchained:events@1.0.0-beta15');
  api.use('unchained:utils@1.0.0-beta15');

  api.mainModule('src/bookmarks-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript@4.1.2');

  api.use('unchained:mongodb@1.0.0-beta15');
  api.use('unchained:core-bookmarks@1.0.0-beta15');

  api.mainModule('test/bookmarks-index.test.ts');
});
