Package.describe({
  name: 'unchained:core-products',
  version: '1.1.3',
  summary: 'Unchained Engine Core: Products',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lru-cache': '7.7.0',
  'abort-controller': '3.0.0',
  'simpl-schema': '1.12.0',
  '@unchainedshop/utils': '1.1.3',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:events@1.1.3');
  api.use('unchained:file-upload@1.1.3');

  api.mainModule('src/products-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb');
  api.use('unchained:core-products');

  api.mainModule('tests/products-index.test.ts');
});
