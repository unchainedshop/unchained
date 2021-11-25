Package.describe({
  name: 'unchained:logger',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine: Logger',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'safe-stable-stringify': '1.1.0',
  'simpl-schema': '1.12.0',
  winston: '3.3.3',
  'winston-transport': '4.4.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('typescript');

  api.mainModule('src/logger-index.ts', 'server');
});
