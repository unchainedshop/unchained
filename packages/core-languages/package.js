Package.describe({
  name: 'unchained:core-languages',
  version: '0.36.1',
  summary: 'Unchained Engine Core: Languages',
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
  api.use('unchained:utils@0.36.1');

  api.mainModule('languages.js', 'server');
});

Package.onTest(api => {
  api.use('ecmascript');
  api.use('unchained:core-languages');
  api.mainModule('languages-tests.js');
});
