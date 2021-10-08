Package.describe({
  name: 'unchained:core-logger',
  version: '1.0.0-beta12',
  summary: 'Unchained Engine Core: Logger',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'safe-stable-stringify': '1.1.0',
  'simpl-schema': '1.12.0',
  'unchained-core-mongodb-utils': '1.0.0',
  'unchained-utils': '1.0.1',
  winston: '3.3.3',
  'winston-transport': '4.4.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  
  api.mainModule('lib/logs.js', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript@4.1.2');

  api.use('unchained:core-mongodb@1.0.0-beta12');
  api.use('unchained:core-logger@1.0.0-beta12');

  api.mainModule('test/logs.test.js');
});
