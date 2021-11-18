Package.describe({
  name: 'unchained:core-discounting',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine Core: Discounting',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'unchained-logger': '1.1.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');

  api.use('unchained:utils@1.0.0-beta15');

  api.mainModule('discounting.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-discounting');
  api.mainModule('discounting-tests.js');
});
