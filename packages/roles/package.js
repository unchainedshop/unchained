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
    'lodash.isobject': '3.0.2',
    '@share911/meteor-check': '1.0.8',
  });

  api.use(['unchained:core-users', 'mongo', 'ecmascript']);

  api.addFiles(['common/helpers.js', 'common/roles.js', 'common/keys.js']);

  api.addFiles(['server/roles_server.js'], 'server');

  api.mainModule('index.js');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:roles');
});
