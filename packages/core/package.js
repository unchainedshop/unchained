Package.describe({
  name: 'unchained:core',
  version: '1.0.0-beta14',
  summary: 'Unchained Engine Core: Core Umbrella',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'simpl-schema': '1.12.0'
});

Package.onUse((api) => {
  api.versionsFrom('2.2');

  api.use('ecmascript');
  api.use('promise');
  api.use('typescript@4.1.2');

  // api.use('unchained:core-bookmarks@1.0.0-beta14');
  // api.use('unchained:core-events@1.0.0-beta14');
  // api.use('unchained:core-logger@1.0.0-beta14');
  api.use('unchained:core-mongodb@1.0.0-beta14');

  // api.use('unchained:core-currencies@1.0.0-beta14');
  // api.use('unchained:core-countries@1.0.0-beta13');
  // api.use('unchained:core-delivery@1.0.0-beta14');
  // api.use('unchained:core-discounting@1.0.0-beta14');
  // api.use('unchained:core-documents@1.0.0-beta14');
  // api.use('unchained:core-languages@1.0.0-beta14');
  // api.use('unchained:core-messaging@1.0.0-beta14');
  // api.use('unchained:core-quotations@1.0.0-beta14');
  // api.use('unchained:core-orders@1.0.0-beta14');
  // api.use('unchained:core-payment@1.0.0-beta14');
  // api.use('unchained:core-pricing@1.0.0-beta14');
  // api.use('unchained:core-products@1.0.0-beta14');
  // api.use('unchained:core-users@1.0.0-beta14');
  // api.use('unchained:core-accountsjs@1.0.0-beta14');
  // api.use('unchained:core-warehousing@1.0.0-beta14');
  // api.use('unchained:core-filters@1.0.0-beta14');
  // api.use('unchained:core-assortments@1.0.0-beta14');
  // api.use('unchained:core-worker@1.0.0-beta14');
  // api.use('unchained:core-enrollments@1.0.0-beta14');

  api.imply([
    'unchained:core-mongodb',
    // 'unchained:core-logger',
    // 'unchained:core-events',
    //'unchained:core-bookmarks',

    // 'unchained:core-currencies',
    // 'unchained:core-countries',
    // 'unchained:core-delivery',
    // 'unchained:core-discounting',
    // 'unchained:core-documents',
    // 'unchained:core-languages',
    // 'unchained:core-messaging',
    // 'unchained:core-quotations',
    // 'unchained:core-orders',
    // 'unchained:core-payment',
    // 'unchained:core-pricing',
    // 'unchained:core-products',
    // 'unchained:core-users',
    // 'unchained:core-accountsjs',
    // 'unchained:core-warehousing',
    // 'unchained:core-filters',
    // 'unchained:core-assortments',
    // 'unchained:core-worker',
    // 'unchained:core-enrollments',
  ]);

  api.mainModule('core.js', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript@4.1.2');

  api.use('unchained:core@1.0.0-beta14');

  api.mainModule('core.tests.js');
});
