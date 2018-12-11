/* globals Package */
Package.describe({
  name: 'unchained:core-avatars',
  version: '0.17.0',
  summary: 'Unchained Engine Core: Avatars',
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
  api.use('ostrio:files@1.9.11');
  api.use('unchained:utils@0.17.0');

  api.mainModule('avatars.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-avatars');
  api.mainModule('avatars-tests.js');
});
