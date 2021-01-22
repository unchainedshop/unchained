Package.describe({
  name: 'unchained:platform',
  version: '0.60.0',
  summary: 'Unchained Engine',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');

  api.use('ecmascript');
  api.use('check');
  api.use('email');
  api.use('percolate:migrations@1.0.2');

  api.use('unchained:core@0.60.0');
  api.use('unchained:api@0.60.0');

  api.mainModule('platform.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:platform');
  api.mainModule('platform-tests.js');
});
