Package.describe({
  name: 'unchained:mongodb',
  version: '1.1.3',
  summary: 'Unchained Engine: MongoDB provider for unchained platform',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  '@unchainedshop/utils': '1.1.3',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('mongo');
  api.use('ecmascript');
  api.use('typescript');

  api.mainModule('src/mongodb-index.js');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb@1.1.3');

  api.mainModule('test/mongodb-index.tests.js');
});
