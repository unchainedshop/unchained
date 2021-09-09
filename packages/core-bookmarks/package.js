Package.describe({
  name: 'unchained:core-bookmarks',
  version: '1.0.0-beta12',
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

  api.use('unchained:utils@1.0.0-beta12');
  api.use('unchained:core-logger@1.0.0-beta12');
  api.use('unchained:core-events@1.0.0-beta12');

  api.mainModule('bookmarks.ts', 'server');
});

Package.onTest((api) => {
  api.use('mongo');
  api.use('ecmascript');
  api.use('typescript@4.1.2');
  
  api.use('unchained:core-bookmarks');

  api.mainModule('package.tests.js');
});
