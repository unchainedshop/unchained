/* globals Package */
Package.describe({
  name: 'unchained:core-messaging',
  version: '0.22.0',
  summary: 'Unchained Engine Core: Messaging',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.8');
  api.use('ecmascript');
  api.use('unchained:core-logger@0.22.0');

  api.mainModule('messaging.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-messaging');
  api.mainModule('messaging-tests.js');
});
