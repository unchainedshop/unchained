Package.describe({
  name: 'unchained:events',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine: Event Director',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  redis: '3.0.2',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.0.0-beta15');

  api.mainModule('src/events-index.ts', 'server');
});
