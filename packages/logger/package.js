Package.describe({
  name: 'unchained:logger',
  version: '1.0.0-rc.14',
  summary: 'Unchained Engine: Logger',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'safe-stable-stringify': '1.1.0',
  winston: '3.3.3',
  'winston-transport': '4.4.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.6.1');
  api.use('ecmascript');
  api.use('typescript');

  api.mainModule('src/logger-index.ts', 'server');
});
