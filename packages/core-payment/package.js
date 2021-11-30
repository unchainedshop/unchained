Package.describe({
  name: 'unchained:core-payment',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine Core: Payment',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'simpl-schema': '1.12.0',
  xml2js: '0.4.23',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('typescript');
  
  api.use('unchained:utils@1.0.0-beta15');
  api.use('unchained:events@1.0.0-beta15');
  api.use('unchained:logger@1.0.0-beta15');

  api.mainModule('src/payment-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('typescript');
  api.use('unchained:core-payment');
  api.mainModule('tests/payment-index.test.ts');
});
