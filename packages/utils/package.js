Package.describe({
  name: 'unchained:utils',
  version: '1.0.0-beta14',
  summary: 'Unchained Engine: Helper Functions',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lru-cache': '6.0.0',
  hashids: '2.2.8',
  locale: '0.1.0',
  'simpl-schema': '1.12.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');

  api.mainModule('lib/utils.js', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('unchained:utils');

  api.mainModule('test/utils.test.js');
});
