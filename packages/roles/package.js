Package.describe({
  name: 'unchained:roles',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine: Roles',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lodash.clone': '4.5.0',
});

Package.onUse((api) => {
  api.versionsFrom('1.12');

  api.use('ecmascript');
  api.use('unchained:core-users@1.0.0-beta15');
  api.use('typescript');

  api.addFiles(['helpers.ts', 'roles.ts'], 'server');

  api.mainModule('index.ts');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:roles');
});
