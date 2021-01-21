Package.describe({
  name: 'unchained:roles',
  version: '0.55.4',
  summary: 'Unchained Engine: Roles',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.12');

  Npm.depends({
    'lodash.clone': '4.5.0',
  });

  api.use('ecmascript');
  api.use('unchained:core-users');
  api.use('typescript');

  api.addFiles(['helpers.ts', 'roles.ts'], 'server');

  api.mainModule('index.ts');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:roles');
});
