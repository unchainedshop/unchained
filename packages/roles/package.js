Package.describe({
  name: 'unchained:roles',
  version: '0.55.2',
  summary: 'Unchained Engine: Roles',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');

  Npm.depends({
    'lodash.clone': '4.5.0',
  });

  api.use(['ecmascript', 'unchained:core-users']);

  api.addFiles(['helpers.js', 'roles.js'], 'server');

  api.mainModule('index.js');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:roles');
});
