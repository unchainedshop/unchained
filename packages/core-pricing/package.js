Package.describe({
  name: 'unchained:core-pricing',
  version: '1.0.0-beta14',
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
  api.use('unchained:core-logger@1.0.0-beta14');

  api.mainModule('pricing.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-pricing');
  api.mainModule('pricing-tests.js');
});
