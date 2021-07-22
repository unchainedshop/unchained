Package.describe({
  name: 'unchained:core',
  version: '1.0.0-beta9',
  summary: 'Unchained Engine Core: Core Umbrella',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');

  api.use('ecmascript');
  api.use('promise');
  api.use('typescript@4.1.2');

  api.use('unchained:core-currencies@1.0.0-beta9');
  api.use('unchained:core-countries@1.0.0-beta9');
  api.use('unchained:core-delivery@1.0.0-beta9');
  api.use('unchained:core-discounting@1.0.0-beta9');
  api.use('unchained:core-documents@1.0.0-beta9');
  api.use('unchained:core-languages@1.0.0-beta9');
  api.use('unchained:core-logger@1.0.0-beta9');
  api.use('unchained:core-messaging@1.0.0-beta9');
  api.use('unchained:core-quotations@1.0.0-beta9');
  api.use('unchained:core-orders@1.0.0-beta9');
  api.use('unchained:core-payment@1.0.0-beta9');
  api.use('unchained:core-pricing@1.0.0-beta9');
  api.use('unchained:core-products@1.0.0-beta9');
  api.use('unchained:core-users@1.0.0-beta9');
  api.use('unchained:core-accountsjs@1.0.0-beta9');
  api.use('unchained:core-bookmarks@1.0.0-beta9');
  api.use('unchained:core-warehousing@1.0.0-beta9');
  api.use('unchained:core-filters@1.0.0-beta9');
  api.use('unchained:core-assortments@1.0.0-beta9');
  api.use('unchained:core-worker@1.0.0-beta9');
  api.use('unchained:core-subscriptions@1.0.0-beta9');
  api.use('unchained:core-events@1.0.0-beta9');

  api.imply([
    'unchained:core-currencies',
    'unchained:core-countries',
    'unchained:core-delivery',
    'unchained:core-discounting',
    'unchained:core-documents',
    'unchained:core-languages',
    'unchained:core-logger',
    'unchained:core-messaging',
    'unchained:core-quotations',
    'unchained:core-orders',
    'unchained:core-payment',
    'unchained:core-pricing',
    'unchained:core-products',
    'unchained:core-users',
    'unchained:core-accountsjs',
    'unchained:core-bookmarks',
    'unchained:core-warehousing',
    'unchained:core-filters',
    'unchained:core-assortments',
    'unchained:core-worker',
    'unchained:core-subscriptions',
    'unchained:core-events',
  ]);

  api.mainModule('core.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core');
  api.mainModule('core-tests.js');
});
