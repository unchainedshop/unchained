/* globals Package */
Package.describe({
  name: 'unchained:core',
  version: '0.30.0',
  summary: 'Unchained Engine Core: Base Layer',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md'
});

Package.onUse(api => {
  api.versionsFrom('1.8');

  api.use('ecmascript');
  api.use('promise');

  api.use('unchained:core-logger@0.30.0');
  api.use('unchained:core-countries@0.30.0');
  api.use('unchained:core-languages@0.30.0');

  api.mainModule('core.js', 'server');
});

Package.onTest(api => {
  api.use('ecmascript');
  api.use('unchained:core');
  api.mainModule('core-tests.js');
});
