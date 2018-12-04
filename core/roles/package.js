/* globals Package */
Package.describe({
  name: 'unchained:roles',
  version: '0.15.0',
  summary: 'Unchained Engine: Roles',
  git: '',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.8');

  api.use([
    'meteor-base',
    'accounts-base',
    'check',
    'mongo',
    'ecmascript',
    'underscore',
    'dburles:collection-helpers@0.1.6',
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
