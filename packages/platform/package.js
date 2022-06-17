Package.describe({
  name: 'unchained:platform',
  version: '1.1.1',
  summary: 'Unchained Engine',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  JSONStream: '1.3.5',
  'event-iterator': '2.0.0',
  moniker: '0.1.2',
  open: '8.4.0',
  '@unchainedshop/logger': '1.1.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');

  api.use('ecmascript');
  api.use('typescript');
  api.use('check');
  api.use('email');

  api.use('unchained:utils@1.1.0');
  api.use('unchained:events@1.1.0');

  api.use('unchained:mongodb@1.1.0');
  api.use('unchained:core@1.1.0');
  api.use('unchained:api@1.1.0');

  api.use('unchained:core-worker@1.1.0');
  api.use('unchained:core-accountsjs@1.1.0');
  api.use('unchained:core-messaging@1.1.0');

  api.mainModule('src/platform-index.ts', 'server');
});
