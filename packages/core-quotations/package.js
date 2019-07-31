/* globals Package */
Package.describe({
  name: 'unchained:core-quotations',
  version: '0.31.0',
  summary: 'Unchained Engine Core: Quotations',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md'
});

Package.onUse(api => {
  api.versionsFrom('1.8');
  api.use('ecmascript');
  api.use('mongo');
  api.use('dburles:factory@1.1.0');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.0.2');
  api.use('aldeed:schema-index@3.0.0');

  api.use('unchained:core-files@0.31.0');
  api.use('unchained:core@0.31.0');
  api.use('unchained:utils@0.31.0');
  api.use('unchained:core-users@0.31.0');
  api.use('unchained:core-products@0.31.0');
  api.use('unchained:core-countries@0.31.0');
  api.use('unchained:core-logger@0.31.0');
  api.use('unchained:core-messaging@0.31.0');

  api.mainModule('quotations.js', 'server');
});

Package.onTest(api => {
  api.use('ecmascript');
  api.use('unchained:core-quotations');
  api.mainModule('quotations-tests.js');
});
