Package.describe({
  name: 'unchained:core-enrollments',
  version: '1.0.0-rc.3',
  summary: 'Unchained Engine Core: Enrollments',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  hashids: '2.2.1',
  later: '1.2.0',
  locale: '0.1.0',
  moment: '2.29.1',
  'simpl-schema': '1.12.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.0.0-rc.3');
  api.use('unchained:events@1.0.0-rc.3');
  api.use('unchained:logger@1.0.0-rc.3');

  api.mainModule('src/enrollments-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb');
  api.use('unchained:core-users');
  api.use('unchained:core-enrollments');

  api.mainModule('tests/enrollments-index.test.ts');
});
