Package.describe({
  name: 'unchained:core-orders',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine Core: Orders',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'unchained-logger': '1.1.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.2.1');

  api.use('unchained:events@1.0.0-beta15');
  api.use('unchained:utils@1.0.0-beta15');

  api.use('unchained:core-files-next@1.0.0-beta15');
  api.use('unchained:core-pricing@1.0.0-beta15');
  api.use('unchained:core-users@1.0.0-beta15');
  api.use('unchained:core-countries@1.0.0-beta15');
  api.use('unchained:core-documents@1.0.0-beta15');
  api.use('unchained:core-delivery@1.0.0-beta15');
  api.use('unchained:core-products@1.0.0-beta15');
  api.use('unchained:core-discounting@1.0.0-beta15');
  api.use('unchained:core-payment@1.0.0-beta15');
  api.use('unchained:core-quotations@1.0.0-beta15');
  api.use('unchained:core-enrollments@1.0.0-beta15');

  api.mainModule('orders.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-orders');
  api.mainModule('orders-tests.js');
});
