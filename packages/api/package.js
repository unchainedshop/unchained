Package.describe({
  name: 'unchained:api',
  version: '0.55.6',
  summary: 'Unchained Engine: GraphQL API',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  accounting: '0.4.1',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');

  api.use('ecmascript');
  api.use('webapp');
  api.use('check');
  api.use('unchained:core@0.55.4');
  api.use('unchained:roles@0.55.4');
  api.use('unchained:core-currencies@0.55.4');
  api.use('unchained:core-countries@0.55.4');
  api.use('unchained:core-delivery@0.55.4');
  api.use('unchained:core-discounting@0.55.4');
  api.use('unchained:core-documents@0.55.4');
  api.use('unchained:core-languages@0.55.4');
  api.use('unchained:core-logger@0.55.4');
  api.use('unchained:core-quotations@0.55.4');
  api.use('unchained:core-orders@0.55.4');
  api.use('unchained:core-payment@0.55.4');
  api.use('unchained:core-pricing@0.55.4');
  api.use('unchained:core-products@0.55.4');
  api.use('unchained:core-accountsjs@0.55.5');
  api.use('unchained:core-users@0.55.4');
  api.use('unchained:core-bookmarks@0.55.4');
  api.use('unchained:core-warehousing@0.55.4');
  api.use('unchained:core-filters@0.55.4');
  api.use('unchained:core-assortments@0.55.5');
  api.use('unchained:core-subscriptions@0.55.4');

  api.mainModule('api.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:api');
  api.mainModule('api-tests.js');
});
