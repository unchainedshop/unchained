/* globals Package */
Package.describe({
  name: 'unchained:platform',
  version: '0.15.0',
  summary: 'Unchained Engine',
  git: '',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.8');

  api.use('ecmascript');
  api.use('random');
  api.use('check');
  api.use('accounts-base');
  api.use('aldeed:collection2@0.1.7');
  api.use('aldeed:schema-index@1.0.1');
  api.use('unchained:core@0.15.0');
  api.use('unchained:core-avatars@0.15.0');
  api.use('unchained:core-currencies@0.15.0');
  api.use('unchained:core-countries@0.15.0');
  api.use('unchained:core-delivery@0.15.0');
  api.use('unchained:core-discounting@0.15.0');
  api.use('unchained:core-documents@0.15.0');
  api.use('unchained:core-languages@0.15.0');
  api.use('unchained:core-logger@0.15.0');
  api.use('unchained:core-messaging@0.15.0');
  api.use('unchained:core-orders@0.15.0');
  api.use('unchained:core-payment@0.15.0');
  api.use('unchained:core-pricing@0.15.0');
  api.use('unchained:core-products@0.15.0');
  api.use('unchained:core-users@0.15.0');
  api.use('unchained:core-warehousing@0.15.0');
  api.use('unchained:core-filters@0.15.0');
  api.use('unchained:core-assortments@0.15.0');
  api.use('unchained:api@0.15.0');

  api.mainModule('platform.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:platform');
  api.mainModule('platform-tests.js');
});
