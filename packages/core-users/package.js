/* globals Package */
Package.describe({
  name: 'unchained:core-users',
  version: '0.21.0',
  summary: 'Unchained Engine Core: Users',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.8');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('dburles:factory@1.1.0');
  api.use('dburles:collection-helpers@1.1.0');
  
  api.use('percolate:migrations@1.0.2');
  api.use('unchained:utils@0.21.0');
  api.use('unchained:core-logger@0.21.0');
  api.use('unchained:core-languages@0.21.0');
  api.use('unchained:core-countries@0.21.0');
  api.use('unchained:core-files');

  api.mainModule('users.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-users');
  api.mainModule('users-tests.js');
});
