Package.describe({
  name: 'unchained:core-events',
  version: '1.0.0-beta14',
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

  api.mainModule('lib/eventsIndex.js');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript@4.1.2');

  api.use('unchained:core-mongodb@1.0.0-beta14');
  api.use('unchained:core-events@1.0.0-beta14');

  api.mainModule('test/eventsIndex.test.js');
});
