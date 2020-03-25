Package.describe({
  name: 'unchained:core-orders',
  version: '0.45.0',
  summary: 'Unchained Engine Core: Orders',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md'
});

Npm.depends({
  hashids: '2.0.1'
});

Package.onUse(api => {
  api.versionsFrom('1.9');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('dburles:factory@1.1.0');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.0.2');
  api.use('aldeed:schema-index@3.0.0');

  api.use('unchained:utils@0.45.0');
  api.use('unchained:core-files@0.45.0');
  api.use('unchained:core-logger@0.45.0');
  api.use('unchained:core-pricing@0.45.0');
  api.use('unchained:core-users@0.45.0');
  api.use('unchained:core-countries@0.45.0');
  api.use('unchained:core-documents@0.45.0');
  api.use('unchained:core-delivery@0.45.0');
  api.use('unchained:core-products@0.45.0');
  api.use('unchained:core-discounting@0.45.0');
  api.use('unchained:core-payment@0.45.0');
  api.use('unchained:core-quotations@0.45.0');

  api.mainModule('orders.js', 'server');
});

Package.onTest(api => {
  api.use('ecmascript');
  api.use('unchained:core-orders');
  api.mainModule('orders-tests.js');
});
