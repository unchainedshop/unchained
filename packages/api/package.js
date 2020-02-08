Package.describe({
  name: 'unchained:api',
  version: '0.39.0', // eslint-disable-line
  summary: 'Unchained Engine: GraphQL API',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md'
});

Package.onUse(api => {
  api.versionsFrom('1.9');

  api.use('ecmascript');
  api.use('meteor');
  api.use('http');
  api.use('webapp');
  api.use('accounts-base');
  api.use('random');
  api.use('check');
  api.use('unchained:core@0.39.0');
  api.use('unchained:roles@0.39.0');
  api.use('unchained:core-currencies@0.39.0');
  api.use('unchained:core-countries@0.39.0');
  api.use('unchained:core-delivery@0.39.0');
  api.use('unchained:core-discounting@0.39.0');
  api.use('unchained:core-documents@0.39.0');
  api.use('unchained:core-languages@0.39.0');
  api.use('unchained:core-logger@0.39.0');
  api.use('unchained:core-messaging@0.39.0');
  api.use('unchained:core-quotations@0.39.0');
  api.use('unchained:core-orders@0.39.0');
  api.use('unchained:core-payment@0.39.0');
  api.use('unchained:core-pricing@0.39.0');
  api.use('unchained:core-products@0.39.0');
  api.use('unchained:core-users@0.39.0');
  api.use('unchained:core-bookmarks@0.39.0');
  api.use('unchained:core-warehousing@0.39.0');
  api.use('unchained:core-filters@0.39.0');
  api.use('unchained:core-assortments@0.39.0');

  api.mainModule('api.js', 'server');
});

Package.onTest(api => {
  api.use('ecmascript');
  api.use('unchained:api');
  api.mainModule('api-tests.js');
});
