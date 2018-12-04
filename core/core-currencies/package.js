/* globals Package */
Package.describe({
  name: 'unchained:core-currencies',
  version: '0.15.0',
  summary: 'Unchained Engine Core: Currencies',
  git: '',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.8');
  api.use('ecmascript');
  api.use('mongo');
  api.use('dburles:factory@0.1.9');
  api.use('dburles:collection-helpers@0.1.6');
  api.use('unchained:utils@0.15.0');

  api.mainModule('currencies.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-currencies');
  api.mainModule('currencies-tests.js');
});
