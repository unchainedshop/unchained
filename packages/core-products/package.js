Package.describe({
  name: 'unchained:core-products',
  version: '1.1.0',
  summary: 'Unchained Engine Core: Products',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lru-cache': '7.7.0',
  'abort-controller': '3.0.0',
  'simpl-schema': '1.12.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.0.0');
  api.use('unchained:events@1.0.0');
  api.use('unchained:file-upload@1.0.0');

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
