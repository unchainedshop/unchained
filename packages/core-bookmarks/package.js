Package.describe({
  name: 'unchained:core-bookmarks',
  version: '1.0.0-beta7',
  summary: 'Unchained Engine Core: Warehousing',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});
Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('typescript@4.1.2');

  api.use('aldeed:collection2@3.2.1');

  api.use('unchained:utils@1.0.0-beta7');
  api.use('unchained:core-logger@1.0.0-beta7');
  api.use('unchained:core-events@1.0.0-beta7');

  api.mainModule('bookmarks.ts', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-bookmarks');
  api.mainModule('bookmarks-tests.js');
});
