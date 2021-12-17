Package.describe({
  name: 'unchained:director-discounting',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine: Discounting Director',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.0.0-beta15');
  api.use('unchained:logger@1.0.0-beta15');

  api.mainModule('src/discounting-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:director-discounting');

  api.mainModule('tests/discounting-index.test.ts');
});
