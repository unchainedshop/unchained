Package.describe({
  name: 'unchained:core-assortments',
  version: '0.51.6',
  summary: 'Unchained Engine Core: Assortments',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.10');
  api.use('ecmascript');
  api.use('mongo');
  api.use('dburles:factory@1.1.0');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.0.2');
  api.use('aldeed:schema-index@3.0.0');
  api.use('unchained:utils@0.51.6');
  api.use('unchained:core-countries@0.51.6');
  api.use('unchained:core-products@0.51.6');
  api.use('unchained:core-filters@0.51.6');

  api.mainModule('assortments.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-assortments');
  api.mainModule('assortments-tests.js');
});
