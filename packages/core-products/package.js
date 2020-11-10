Package.describe({
  name: 'unchained:core-products',
  version: '0.54.1',
  summary: 'Unchained Engine Core: Products',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.2.1');
  api.use('percolate:migrations@1.0.2');

  api.use('unchained:utils@0.54.1');
  api.use('unchained:core@0.54.1');
  api.use('unchained:core-files@0.54.1');
  api.use('unchained:core-users@0.54.1');
  api.use('unchained:core-pricing@0.54.1');
  api.use('unchained:core-warehousing@0.54.1');
  api.use('unchained:core-countries@0.54.1');

  api.mainModule('products.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-products');
  api.mainModule('products-tests.js');
});
