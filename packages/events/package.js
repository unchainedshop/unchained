Package.describe({
  name: 'unchained:events',
  version: '1.1.0',
  summary: 'Unchained Engine: Event Director',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  redis: '3.0.2',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:logger@1.0.0');

  api.mainModule('src/events-index.ts', 'server');
});
