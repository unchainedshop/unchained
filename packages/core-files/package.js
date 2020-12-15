Package.describe({
  name: 'unchained:core-files',
  version: '0.55.4',
  summary: 'Unchained Engine Core: Files',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lodash.merge': '4.6.2',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');
  api.use('ostrio:files@1.14.2');
  api.use('ecmascript');
  api.use('unchained:core-settings@0.55.4');
  api.mainModule('core-files.js');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-files');
  api.mainModule('core-files-tests.js');
});
