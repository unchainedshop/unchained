Package.describe({
  name: 'unchained:core-products',
  version: '1.0.0-beta2',
  summary: 'Unchained Engine Core: Products',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.2.1');
  api.use('percolate:migrations@1.0.2');

  api.use('unchained:utils@1.0.0-beta2');
  api.use('unchained:core-files@1.0.0-beta2');
  api.use('unchained:core-users@1.0.0-beta2');
  api.use('unchained:core-pricing@1.0.0-beta2');
  api.use('unchained:core-warehousing@1.0.0-beta2');
  api.use('unchained:core-countries@1.0.0-beta2');
  api.use('unchained:core-events@1.0.0-beta2');

  api.mainModule('products.js', 'server');
});

Npm.depends({
  hashids: '2.2.1',
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-products');
  api.mainModule('products-tests.js');
});
