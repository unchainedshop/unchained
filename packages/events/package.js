Package.describe({
  name: 'unchained:events',
  version: '1.1.0',
  summary: 'Unchained Engine: Event Director',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  redis: '4.1.0',
  '@unchainedshop/logger': '1.1.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.mainModule('src/events-index.ts', 'server');
});
