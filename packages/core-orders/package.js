Package.describe({
  name: 'unchained:core-orders',
  version: '1.0.0-rc.9',
  summary: 'Unchained Engine Core: Orders',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'simpl-schema': '1.12.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.0.0-rc.9');
  api.use('unchained:events@1.0.0-rc.9');
  api.use('unchained:logger@1.0.0-rc.9');

  api.mainModule('src/orders-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb');
  api.use('unchained:core-orders');

  api.mainModule('tests/orders-index.test.ts');
});
