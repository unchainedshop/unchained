Package.describe({
  name: 'unchained:roles',
  version: '0.55.0',
  summary: 'Unchained Engine: Roles',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');

  api.use([
    'meteor-base',
    'check',
    'mongo',
    'ecmascript',
    'underscore',
    'dburles:collection-helpers@1.1.0',
    'unchained:core-users@0.55.0',
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
