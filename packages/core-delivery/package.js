Package.describe({
  name: 'unchained:core-delivery',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine Core: Delivery',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'unchained-events': '1.1.0',
  'unchained-logger': '1.1.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.2.1');

  api.use('unchained:utils@1.0.0-beta15');

  api.use('unchained:core-pricing@1.0.0-beta15');
  api.use('unchained:core-countries@1.0.0-beta15');
  api.use('unchained:core-worker@1.0.0-beta15');

  api.mainModule('delivery.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-delivery');
  api.mainModule('delivery-tests.js');
});
