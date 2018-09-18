/* globals Package */
Package.describe({
  name: 'unchained:core-products',
  version: '0.3.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.7');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('dburles:factory');
  api.use('dburles:collection-helpers');
  api.use('ostrio:files');

  api.use('unchained:utils');
  api.use('unchained:core');
  api.use('unchained:core-pricing');
  api.use('unchained:core-warehousing');
  api.use('unchained:core-users', { unordered: true });
  api.use('unchained:core-countries', { unordered: true });
  api.use('unchained:core-assortments', { unordered: true });

  api.mainModule('products.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-products');
  api.mainModule('products-tests.js');
});
