Package.describe({
  name: 'unchained:platform',
  version: '1.0.0-beta7',
  summary: 'Unchained Engine',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  moniker: '0.1.2',
  open: '7.3.1',
  'yieldable-json': '2.0.1',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');

  api.use('ecmascript');
  api.use('check');
  api.use('email');
  api.use('percolate:migrations@1.0.2');

  api.use('unchained:core@1.0.0-beta7');
  api.use('unchained:api@1.0.0-beta7');

  api.mainModule('platform.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:platform');
  api.mainModule('platform-tests.js');
});
