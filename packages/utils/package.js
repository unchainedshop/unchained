Package.describe({
  name: 'unchained:utils',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine: Helper Functions',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lru-cache': '6.0.0',
  hashids: '2.2.8',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.mainModule('utils.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:utils');
  api.mainModule('utils-tests.js');
});
