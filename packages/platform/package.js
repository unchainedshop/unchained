/* globals Package */
Package.describe({
  name: 'unchained:platform',
  version: '0.30.0',
  summary: 'Unchained Engine',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md'
});

Package.onUse(api => {
  api.versionsFrom('1.8');

  api.use('ecmascript');
  api.use('random');
  api.use('check');
  api.use('accounts-base');
  api.use('aldeed:collection2@3.0.1');
  api.use('aldeed:schema-index@3.0.0');
  api.use('dburles:factory@1.1.0');
  api.use('percolate:migrations@1.0.2');
  api.use('unchained:core@0.30.0');
  api.use('unchained:core-currencies@0.30.0');
  api.use('unchained:core-countries@0.30.0');
  api.use('unchained:core-delivery@0.30.0');
  api.use('unchained:core-discounting@0.30.0');
  api.use('unchained:core-documents@0.30.0');
  api.use('unchained:core-languages@0.30.0');
  api.use('unchained:core-logger@0.30.0');
  api.use('unchained:core-messaging@0.30.0');
  api.use('unchained:core-quotations@0.30.0');
  api.use('unchained:core-orders@0.30.0');
  api.use('unchained:core-payment@0.30.0');
  api.use('unchained:core-pricing@0.30.0');
  api.use('unchained:core-products@0.30.0');
  api.use('unchained:core-users@0.30.0');
  api.use('unchained:core-warehousing@0.30.0');
  api.use('unchained:core-filters@0.30.0');
  api.use('unchained:core-assortments@0.30.0');
  api.use('unchained:api@0.30.0');

  api.mainModule('platform.js', 'server');
});

Package.onTest(api => {
  api.use('ecmascript');
  api.use('unchained:platform');
  api.mainModule('platform-tests.js');
});
