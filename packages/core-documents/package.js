Package.describe({
  name: 'unchained:core-documents',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine Core: Documents',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('typescript');
  api.use('http@2.0.0');

  api.use('unchained:utils@1.0.0-beta15');
  api.use('unchained:logger@1.0.0-beta15');

  api.mainModule('src/documents-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:core-documents');

  api.mainModule('tests/documents-index.test.ts');
});
