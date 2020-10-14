Package.describe({
  name: 'unchained:platform',
  version: '0.53.3',
  summary: 'Unchained Engine',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');

  api.use('ecmascript');
  api.use('check');
  api.use('accounts-base');
  api.use('email');
  api.use('percolate:migrations@1.0.2');

  api.use('unchained:core@0.53.3');
  api.use('unchained:core-currencies@0.53.3');
  api.use('unchained:core-countries@0.53.3');
  api.use('unchained:core-delivery@0.53.3');
  api.use('unchained:core-discounting@0.53.3');
  api.use('unchained:core-documents@0.53.3');
  api.use('unchained:core-languages@0.53.3');
  api.use('unchained:core-logger@0.53.3');
  api.use('unchained:core-messaging@0.53.3');
  api.use('unchained:core-quotations@0.53.3');
  api.use('unchained:core-orders@0.53.3');
  api.use('unchained:core-payment@0.53.3');
  api.use('unchained:core-pricing@0.53.3');
  api.use('unchained:core-products@0.53.3');
  api.use('unchained:core-users@0.53.3');
  api.use('unchained:core-bookmarks@0.53.3');
  api.use('unchained:core-warehousing@0.53.3');
  api.use('unchained:core-filters@0.53.3');
  api.use('unchained:core-assortments@0.53.3');
  api.use('unchained:core-worker@0.53.3');
  api.use('unchained:core-subscriptions@0.53.3');
  api.use('unchained:api@0.53.3');

  api.mainModule('platform.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:platform');
  api.mainModule('platform-tests.js');
});
