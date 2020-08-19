Package.describe({
  name: 'unchained:core-bookmarks',
  version: '0.52.0',
  summary: 'Unchained Engine Core: Warehousing',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.10');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('dburles:factory@1.1.0');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.0.2');
  api.use('aldeed:schema-index@3.0.0');

  api.use('unchained:utils@0.52.0');
  api.use('unchained:core-logger@0.52.0');

  api.mainModule('bookmarks.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-bookmarks');
  api.mainModule('bookmarks-tests.js');
});
