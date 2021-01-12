Package.describe({
  name: 'unchained:core',
  version: '0.55.4',
  summary: 'Unchained Engine Core: Core Umbrella',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');

  api.use('ecmascript');
  api.use('promise');
  api.use('typescript@4.1.2');

  api.use('unchained:core-currencies@0.55.4');
  api.use('unchained:core-countries@0.55.4');
  api.use('unchained:core-delivery@0.55.4');
  api.use('unchained:core-discounting@0.55.4');
  api.use('unchained:core-documents@0.55.4');
  api.use('unchained:core-languages@0.55.4');
  api.use('unchained:core-logger@0.55.4');
  api.use('unchained:core-messaging@0.55.4');
  api.use('unchained:core-quotations@0.55.4');
  api.use('unchained:core-orders@0.55.4');
  api.use('unchained:core-payment@0.55.4');
  api.use('unchained:core-pricing@0.55.4');
  api.use('unchained:core-products@0.55.4');
  api.use('unchained:core-users@0.55.4');
  api.use('unchained:core-accountsjs@0.55.5');
  api.use('unchained:core-bookmarks@0.55.4');
  api.use('unchained:core-warehousing@0.55.4');
  api.use('unchained:core-filters@0.55.4');
  api.use('unchained:core-assortments@0.55.6');
  api.use('unchained:core-worker@0.55.4');
  api.use('unchained:core-subscriptions@0.55.4');

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
  ]);

  api.mainModule('core.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core');
  api.mainModule('core-tests.js');
});
