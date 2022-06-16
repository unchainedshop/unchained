Package.describe({
  name: 'unchained:logger',
  version: '1.1.0',
  summary: 'Unchained Engine: Logger',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'safe-stable-stringify': '2.3.1',
  winston: '3.7.2',
  'winston-transport': '4.5.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.mainModule('src/logger-index.ts', 'server');
});
