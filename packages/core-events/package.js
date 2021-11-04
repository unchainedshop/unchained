Package.describe({
  name: 'unchained:core-events',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine: Events',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  redis: '3.0.2',
  'simpl-schema': '1.12.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('typescript@4.1.2');
  
  api.use('unchained:utils@1.0.0-beta15');
  api.use('unchained:core-logger@1.0.0-beta15');

  api.mainModule('src/events-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript@4.1.2');

  api.use('unchained:core-mongodb@1.0.0-beta15');
  api.use('unchained:core-events@1.0.0-beta15');

  api.mainModule('test/events-index.test.js');
});
