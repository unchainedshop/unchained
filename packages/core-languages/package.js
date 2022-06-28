Package.describe({
  name: 'unchained:core-languages',
  version: '1.1.3',
  summary: 'Unchained Engine Core: Languages',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  '@unchainedshop/utils': '1.1.3',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:events@1.1.3');

  api.mainModule('src/languages-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:core-languages');

  api.mainModule('tests/languages-index.test.ts');
});
