Package.describe({
  name: 'unchained:core-currencies',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine Core: Currencies',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'simpl-schema': '1.12.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('typescript')

  api.use('unchained:utils@1.0.0-beta15');
  api.use('unchained:events@1.0.0-beta15');

  api.mainModule('src/currencies-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb@1.0.0-beta15');
  api.use('unchained:core-currencies@1.0.0-beta15');

  api.mainModule('test/currencies-index.test.ts');

});
