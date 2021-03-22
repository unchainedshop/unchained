Package.describe({
  name: 'unchained:core-events',
  version: '0.61.0',
  summary: 'Unchained Engine: Events',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');
  api.use('ecmascript');
  api.use('typescript@4.1.2');
  api.use('unchained:core-logger@0.61.0');
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
