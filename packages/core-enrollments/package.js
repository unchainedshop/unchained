Package.describe({
  name: 'unchained:core-enrollments',
  version: '1.1.3',
  summary: 'Unchained Engine Core: Enrollments',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  later: '1.2.0',
  locale: '0.1.0',
  moment: '2.29.1',
  'simpl-schema': '1.12.0',
  '@unchainedshop/logger': '1.1.3',
  '@unchainedshop/utils': '1.1.3',
  // '@unchainedshop/events': '1.1.4', // PEER
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

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
