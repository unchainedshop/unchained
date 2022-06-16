Package.describe({
  name: 'unchained:core-events',
  version: '1.1.0',
  summary: 'Unchained Engine: Core Events',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'simpl-schema': '1.12.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.1.0');
  api.use('unchained:events@1.1.0');

  api.mainModule('src/events-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb');
  api.use('unchained:core-events');

  api.mainModule('tests/events-index.test.ts');
});
