Package.describe({
  name: 'unchained:core-messaging',
  version: '0.61.1',
  summary: 'Unchained Engine Core: Messaging',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  mustache: '4.1.0',
  mjml: '4.8.1',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');
  api.use('ecmascript');
  api.use('unchained:core-logger@0.61.0');
  api.use('unchained:core-worker@0.61.0');

  api.mainModule('messaging.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-messaging');
  api.mainModule('messaging-tests.js');
});
