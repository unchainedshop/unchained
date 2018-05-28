Package.describe({
  name: 'unchained:roles',
  summary: 'The most advanced roles package for meteor',
  version: '3.0.0',
  git: 'https://github.com/nicolaslopezj/roles',
});

Package.onUse((api) => {
  api.versionsFrom('1.7');

  api.use([
    'meteor-base',
    'accounts-base',
    'check',
    'mongo',
    'ecmascript',
    'underscore',
    'dburles:collection-helpers',
  ]);

  api.addFiles([
    'helpers.js',
    'roles.js',
    'keys.js',
  ]);

  api.addFiles([
    'roles_server.js',
  ], 'server');

  api.export('Roles');
  api.export('objectHasKey');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:roles');
});
