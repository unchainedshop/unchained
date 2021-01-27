Package.describe({
  name: 'unchained:utils',
  version: '0.61.0',
  summary: 'Unchained Engine: Helper Functions',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lru-cache': '6.0.0',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');
  api.use('ecmascript');
  api.mainModule('utils.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:utils');
  api.mainModule('utils-tests.js');
});
