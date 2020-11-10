Package.describe({
  name: 'unchained:core-logger',
  version: '0.54.1',
  summary: 'Unchained Engine Core: Logger',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  winston: '3.2.1',
  'winston-transport': '4.3.0',
  'safe-stable-stringify': '1.1.0',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('percolate:migrations@1.0.2');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.2.1');
  api.use('unchained:utils@0.54.1');
  api.mainModule('logger.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-logger');
  api.mainModule('logger-tests.js');
});
