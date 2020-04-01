Package.describe({
  name: 'unchained:utils',
  version: '0.45.0',
  summary: 'Unchained Engine: Helper Functions',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.9');
  api.use('ecmascript');
  api.mainModule('utils.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:utils');
  api.mainModule('utils-tests.js');
});
