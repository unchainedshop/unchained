Package.describe({
  name: 'unchained:core-files',
  version: '1.0.0-beta9',
  summary: 'Unchained Engine Core: Files',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lodash.merge': '4.6.2',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ostrio:files@2.0.1');
  api.use('ecmascript');
  api.use('unchained:core-settings@1.0.0-beta9');
  api.mainModule('core-files.js');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-files');
  api.mainModule('core-files-tests.js');
});
