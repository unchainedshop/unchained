Package.describe({
  name: 'unchained:services-bookmarks',
  version: '1.0.0-beta12',
  summary: 'Unchained Engine Service: Bookmarks',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});
Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('promise');
  api.use('typescript@4.1.2');

  api.use('unchained:core@1.0.0-beta12');

  api.mainModule('bookmarks.services.ts', 'server');
});
