Package.describe({
  name: 'unchained:platform',
  version: '0.55.6',
  summary: 'Unchained Engine',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');

  api.use('ecmascript');
  api.use('check');
  api.use('email');
  api.use('percolate:migrations@1.0.2');

  api.use('unchained:core@0.55.4');
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
  api.use('unchained:core-assortments@0.55.5');
  api.use('unchained:core-worker@0.55.4');
  api.use('unchained:core-subscriptions@0.55.4');
  api.use('unchained:api@0.55.5');

  api.mainModule('platform.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:platform');
  api.mainModule('platform-tests.js');
});
