Package.describe({
  name: 'unchained:core-messaging',
  version: '1.1.0',
  summary: 'Unchained Engine Core: Messaging',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  mustache: '4.1.0',
  mjml: '4.8.1',
  '@unchainedshop/logger': '1.1.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.mainModule('src/messaging-index.ts', 'server');
});
