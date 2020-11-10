Package.describe({
  name: 'unchained:roles',
  version: '0.54.1',
  summary: 'Unchained Engine: Roles',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');

  Npm.depends({
    'lodash.clone': '4.5.0',
  });

  api.use([
    'unchained:core-users',
    'meteor-base',
    'check',
    'mongo',
    'ecmascript',
  ]);

  api.addFiles(['helpers.js', 'roles.js', 'keys.js']);

  api.addFiles(['roles_server.js'], 'server');

  api.export('Roles');
  api.export('objectHasKey');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:roles');
});
