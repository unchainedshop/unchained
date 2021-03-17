Package.describe({
  name: 'unchained:core-events',
  version: '0.61.0',
  summary: 'Unchained Engine: Events',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.12');
  api.use('ecmascript');
  api.use('typescript');
  api.use('unchained:core-logger@0.61.0');
  api.mainModule('index.ts');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('unchained:core-events');
  api.mainModule('core-events-tests.js');
});
