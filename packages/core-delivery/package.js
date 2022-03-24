Package.describe({
  name: 'unchained:core-delivery',
  version: '1.0.0-rc.12',
  summary: 'Unchained Engine Core: Delivery',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'simpl-schema': '1.12.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.6.1');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:logger@1.0.0-rc.12');
  api.use('unchained:utils@1.0.0-rc.12');
  api.use('unchained:events@1.0.0-rc.12');

  api.mainModule('src/delivery-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb');
  api.use('unchained:core-delivery');

  api.mainModule('tests/delivery-index.test.ts');
});
