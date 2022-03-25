Package.describe({
  name: 'unchained:core-assortments',
  version: '1.0.0-rc.13',
  summary: 'Unchained Engine Core: Assortments',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  locale: '0.1.0',
  ramda: '0.27.1',
  'simpl-schema': '1.12.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.6.1');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.0.0-rc.13');
  api.use('unchained:events@1.0.0-rc.13');
  api.use('unchained:logger@1.0.0-rc.13');
  api.use('unchained:file-upload@1.0.0-rc.13');

  api.mainModule('src/assortments-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb');
  api.use('unchained:core-assortments');

  api.mainModule('tests/assortments-index.test.ts');
});
