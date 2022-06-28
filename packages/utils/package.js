Package.describe({
  name: 'unchained:utils',
  version: '1.1.3',
  summary: 'Unchained Engine: Helper Functions',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lru-cache': '7.10.1',
  'abort-controller': '3.0.0',
  hashids: '2.2.10',
  locale: '0.1.0',
  'simpl-schema': '1.12.2',
  bson: '4.6.4',
  '@unchainedshop/logger': '1.1.3',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript@4.4.0');

  api.mainModule('src/utils-index.js', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript@4.4.0');

  api.use('unchained:utils@1.1.3');

  api.mainModule('tests/utils-index.test.js');
});
