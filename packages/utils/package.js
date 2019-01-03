/* globals Package */
Package.describe({
  name: 'unchained:utils',
  version: '0.19.0',
  summary: 'Unchained Engine: Helper Functions',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.8');
  api.use('ecmascript');
  api.mainModule('utils.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:utils');
  api.mainModule('utils-tests.js');
});
