Package.describe({
  name: 'unchained:core-languages',
  version: '1.0.0-rc.11',
  summary: 'Unchained Engine Core: Languages',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('2.6.1');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.0.0-rc.11');
  api.use('unchained:events@1.0.0-rc.11');

  api.mainModule('src/languages-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:core-languages');

  api.mainModule('tests/languages-index.test.ts');
});
