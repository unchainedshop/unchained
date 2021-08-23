Package.describe({
  name: 'unchained:core-files-next',
  version: '1.0.0-beta12',
  summary: 'Unchained Engine: Files',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse(function (api) {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('typescript@4.1.2');
  api.use('unchained:core-logger@1.0.0-beta12');

  api.mainModule('index.ts', 'server');
});

Npm.depends({
  minio: '7.0.18',
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('unchained:core-files-next');
  api.mainModule('core-files-next-tests.js');
});
