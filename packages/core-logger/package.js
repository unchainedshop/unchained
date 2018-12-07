/* globals Package */
Package.describe({
  name: 'unchained:core-logger',
  version: '0.16.0',
  summary: 'Unchained Engine Core: Logger',
  git: '',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.8');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('percolate:migrations@1.0.2');
  api.use('dburles:factory@1.1.0');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('unchained:utils@0.16.0');
  api.mainModule('logger.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-logger');
  api.mainModule('logger-tests.js');
});
