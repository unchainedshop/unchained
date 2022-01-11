Package.describe({
  name: 'unchained:core',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine Core: Core Umbrella',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');

  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:core-accountsjs@1.0.0-beta15');
  api.use('unchained:core-assortments@1.0.0-beta15');
  api.use('unchained:core-bookmarks@1.0.0-beta15');
  api.use('unchained:core-countries@1.0.0-beta13');
  api.use('unchained:core-currencies@1.0.0-beta15');
  api.use('unchained:core-delivery@1.0.0-beta15');
  api.use('unchained:core-enrollments@1.0.0-beta15');
  api.use('unchained:core-events@1.0.0-beta15');
  api.use('unchained:core-filters@1.0.0-beta15');
  api.use('unchained:core-languages@1.0.0-beta15');
  api.use('unchained:core-messaging@1.0.0-beta15');
  api.use('unchained:core-orders@1.0.0-beta15');
  api.use('unchained:core-payment@1.0.0-beta15');
  api.use('unchained:core-products@1.0.0-beta15');
  api.use('unchained:core-quotations@1.0.0-beta15');
  api.use('unchained:core-users@1.0.0-beta15');
  api.use('unchained:core-warehousing@1.0.0-beta15');
  api.use('unchained:core-worker@1.0.0-beta15');

  api.mainModule('src/core-index.js', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:core@1.0.0-beta15');

  api.mainModule('test/core-index.tests.js');
});
