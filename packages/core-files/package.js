Package.describe({
  name: 'unchained:core-files',
  version: '0.61.1',
  summary: 'Unchained Engine Core: Files',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'fs-extra': '9.0.1',
  'isomorphic-unfetch': '3.1.0',
  'file-type': '16.2.0',
  mongodb: '3.6.3',
  '@reactioncommerce/random': '1.0.2',
});

Package.onUse((api) => {
  api.use('ecmascript');
  api.use('unchained:core-settings@0.61.0');
  api.versionsFrom('1.12');
  api.use(['mongo', 'webapp'], 'server');
  api.use('typescript');
  api.mainModule('core-files.ts');
  api.export('FilesCollection');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-files');
  api.mainModule('core-files-tests.js');
});
