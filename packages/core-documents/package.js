Package.describe({
  name: 'unchained:core-documents',
  version: '0.37.1',
  summary: 'Unchained Engine Core: Documents',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md'
});

Package.onUse(api => {
  api.versionsFrom('1.8');
  api.use('ecmascript');
  api.use('unchained:utils@0.37.1');
  api.use('unchained:core-logger@0.37.1');

  api.mainModule('documents.js', 'server');
});

Package.onTest(api => {
  api.use('ecmascript');
  api.use('unchained:core-documents');
  api.mainModule('documents-tests.js');
});
