Package.describe({
  name: 'unchained:platform',
  version: '0.55.6',
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

  api.use('unchained:core@0.55.4');
  api.use('unchained:api@0.55.5');

  api.mainModule('platform.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:platform');
  api.mainModule('platform-tests.js');
});
