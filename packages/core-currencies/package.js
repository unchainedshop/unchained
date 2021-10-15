Package.describe({
  name: 'unchained:core-currencies',
  version: '1.0.0-beta14',
  summary: 'Unchained Engine Core: Currencies',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('mongo');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.2.1');
  api.use('unchained:utils@1.0.0-beta14');
  api.use('unchained:core-events@1.0.0-beta14');

  api.mainModule('currencies.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-currencies');
  api.mainModule('currencies-tests.js');
});
