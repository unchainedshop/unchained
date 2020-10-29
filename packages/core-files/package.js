Package.describe({
  name: 'unchained:core-files',
  version: '0.61.1',
  summary: 'Unchained Engine Core: Files',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lodash.merge': '4.6.2',
  'fs-extra': '9.0.1',
  'request-libcurl': '2.2.1',
  'file-type': '16.0.0',
  eventemitter3: '4.0.7',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');
  api.use('ecmascript');
  api.use('unchained:core-settings@0.61.0');
  api.use('ecmascript');
  api.use('webapp', 'server');
  api.use(
    ['mongo', 'check', 'random', 'ecmascript', 'ostrio:cookies@2.6.1'],
    ['client', 'server']
  );
  api.mainModule('core-files.js');
  api.export('FilesCollection');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-files');
  api.mainModule('core-files-tests.js');
});
