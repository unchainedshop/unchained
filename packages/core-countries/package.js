Package.describe({
  name: 'unchained:core-countries',
  version: '0.43.0',
  summary: 'Unchained Engine Core: Countries',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md'
});

Package.onUse(api => {
  api.versionsFrom('1.9');
  api.use('ecmascript');
  api.use('mongo');
  api.use('dburles:factory@1.1.0');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.0.2');
  api.use('aldeed:schema-index@3.0.0');
  api.use('unchained:utils@0.43.0');
  api.use('unchained:core-currencies@0.43.0');

  api.mainModule('countries.js', 'server');
});

Package.onTest(api => {
  api.use('ecmascript');
  api.use('unchained:core-countries');
  api.mainModule('countries-tests.js');
});
