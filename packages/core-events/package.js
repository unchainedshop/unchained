Package.describe({
  name: 'unchained:core-events',
  version: '1.0.0-beta12',
  summary: 'Unchained Engine: Events',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('typescript@4.1.2');
  api.use('unchained:core-logger@1.0.0-beta12');
  api.mainModule('index.ts');
});

Npm.depends({
  redis: '3.0.2',
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('unchained:core-events');
  api.mainModule('core-events-tests.js');
});
