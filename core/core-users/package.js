/* globals Package */
Package.describe({
  name: 'unchained:core-users',
  version: '0.15.0',
  summary: 'Unchained Engine Core: Users',
  git: '',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.8');
  api.use('ecmascript');
  api.use('mongo');
  api.use('dburles:factory@0.1.9');
  api.use('dburles:collection-helpers@0.1.6');
  api.use('percolate:migrations@0.7.6');
  api.use('unchained:utils@0.15.0');
  api.use('unchained:core-logger@0.15.0');
  api.use('unchained:core-avatars@0.15.0');
  api.use('unchained:core-languages@0.15.0');
  api.use('unchained:core-countries@0.15.0');

  api.mainModule('users.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-users');
  api.mainModule('users-tests.js');
});
