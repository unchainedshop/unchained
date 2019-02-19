/* globals Package */
Package.describe({
  name: 'unchained:core-orders',
  version: '0.21.0',
  summary: 'Unchained Engine Core: Orders',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.8');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('dburles:factory@1.1.0');
  api.use('dburles:collection-helpers@1.1.0');
  
  api.use('unchained:utils@0.21.0');
  api.use('unchained:core-files');
  api.use('unchained:core-logger@0.21.0');
  api.use('unchained:core-pricing@0.21.0');
  api.use('unchained:core-users@0.21.0');
  api.use('unchained:core-countries@0.21.0');
  api.use('unchained:core-documents@0.21.0');
  api.use('unchained:core-delivery@0.21.0');
  api.use('unchained:core-products@0.21.0');
  api.use('unchained:core-discounting@0.21.0');
  api.use('unchained:core-payment@0.21.0');

  api.mainModule('orders.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-orders');
  api.mainModule('orders-tests.js');
});
