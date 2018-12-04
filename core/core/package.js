/* globals Package */
Package.describe({
  name: 'unchained:core',
  version: '0.15.0',
  summary: 'Unchained Engine Core: Base Layer',
  git: '',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.8');

  api.use('ecmascript');
  api.use('promise');
  api.use('dburles:factory@0.1.9');
  api.use('ostrio:files@1.9.11');
  api.use('unchained:core-logger@0.15.0');
  api.use('unchained:core-countries@0.15.0');
  api.use('unchained:core-languages@0.15.0');

  api.mainModule('core.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core');
  api.mainModule('core-tests.js');
});
