Package.describe({
  name: 'unchained:core-pricing',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine Core: Pricing',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lru-cache': '6.0.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:logger@1.0.0-beta15');

  api.mainModule('src/pricing-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb');
  api.use('unchained:core-pricing');

  api.mainModule('tests/pricing-index.test.ts');
});
