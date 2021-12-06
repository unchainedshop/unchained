Package.describe({
  name: 'unchained:file-upload',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine: File Upload',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  minio: '7.0.18',
  'mime-types': '2.1.32',
});

Package.onUse(function (api) {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:logger@1.0.0-beta15');

  api.mainModule('src/file-upload-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb@1.0.0-beta15');
  api.use('unchained:file-upload@1.0.0-beta15');

  api.mainModule('tests/file-upload-index.test.ts');
});
