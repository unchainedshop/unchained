Package.describe({
  name: 'unchained:core-files-next',
  version: '1.0.0-rc.11',
  summary: 'Unchained Engine: Files',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  minio: '7.0.18',
  'mime-types': '2.1.32',
  'simpl-schema': '1.12.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.6.1');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:logger@1.0.0-rc.11');
  api.use('unchained:events@1.0.0-rc.11');
  api.use('unchained:file-upload@1.0.0-rc.11');

  api.mainModule('src/files-next-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb@1.0.0-rc.11');
  api.use('unchained:core-files-next@1.0.0-rc.11');

  api.mainModule('tests/files-next-index.test.ts');
});
