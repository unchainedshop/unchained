Package.describe({
  name: 'unchained:core-enrollments',
  version: '1.0.0-beta14',
  summary: 'Unchained Engine Core: Enrollments',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  hashids: '2.2.1',
  later: '1.2.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('mongo');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.2.1');

  api.use('unchained:core-files@1.0.0-beta14');
  api.use('unchained:utils@1.0.0-beta14');
  api.use('unchained:core-worker@1.0.0-beta14');
  api.use('unchained:core-users@1.0.0-beta14');
  api.use('unchained:core-products@1.0.0-beta14');
  api.use('unchained:core-countries@1.0.0-beta14');
  api.use('unchained:core-logger@1.0.0-beta14');
  api.use('unchained:core-worker@1.0.0-beta14');
  api.use('unchained:core-events@1.0.0-beta14');

  api.mainModule('enrollments.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-enrollments');
  api.mainModule('enrollments-tests.js');
});
