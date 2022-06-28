Package.describe({
  name: 'unchained:platform',
  version: '1.1.3',
  summary: 'Unchained Engine',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  // JSONStream: '1.3.5', // PEER
  // 'event-iterator': '2.0.0', // PEER
  moniker: '0.1.2',
  open: '8.4.0',
  '@unchainedshop/logger': '1.1.3',
  '@unchainedshop/utils': '1.1.3',
  // '@unchainedshop/events': '1.1.4', // PEER
  // '@unchainedshop/plugins': '1.1.3', // PEER
  // '@unchainedshop/core-worker': '1.1.3', // PEER
  // '@unchainedshop/core-messaging': '1.1.3', // PEER
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');

  api.use('ecmascript');
  api.use('typescript');
  api.use('check');
  api.use('email');

  api.use('unchained:mongodb@1.1.3');
  api.use('unchained:core@1.1.3');
  api.use('unchained:api@1.1.3');

  api.use('unchained:core-accountsjs@1.1.3');

  api.mainModule('src/platform-index.ts', 'server');
});
