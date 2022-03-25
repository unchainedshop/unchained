Package.describe({
  name: 'unchained:core-bookmarks',
  version: '1.0.0-rc.13',
  summary: 'Unchained Engine Core: Warehousing',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'simpl-schema': '1.12.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.6.1');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.0.0-rc.13');
  api.use('unchained:events@1.0.0-rc.13');

  api.mainModule('src/bookmarks-index.ts', 'server');
});
