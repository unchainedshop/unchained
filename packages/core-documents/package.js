Package.describe({
  name: 'unchained:core-documents',
  version: '1.0.0-beta12',
  summary: 'Unchained Engine Core: Documents',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('http@1.4.3');
  api.use('unchained:utils@1.0.0-beta12');
  api.use('unchained:core-logger@1.0.0-beta12');

  api.mainModule('documents.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-documents');
  api.mainModule('documents-tests.js');
});
