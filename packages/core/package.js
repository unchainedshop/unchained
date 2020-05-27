Package.describe({
  name: 'unchained:core',
  version: '0.49.0',
  summary: 'Unchained Engine Core: Base Layer',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lru-cache': '5.1.1',
});

Package.onUse((api) => {
  api.versionsFrom('1.10');

  api.use('ecmascript');
  api.use('promise');

  api.use('unchained:core-logger@0.49.0');
  api.use('unchained:core-countries@0.49.0');
  api.use('unchained:core-languages@0.49.0');

  api.mainModule('core.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core');
  api.mainModule('core-tests.js');
});
