Package.describe({
  name: 'unchained:core-payment',
  version: '1.0.0-rc.20',
  summary: 'Unchained Engine Core: Payment',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'simpl-schema': '1.12.0',
  xml2js: '0.4.23',
});

Package.onUse((api) => {
  api.versionsFrom('2.6.1');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.0.0-rc.20');
  api.use('unchained:events@1.0.0-rc.20');
  api.use('unchained:logger@1.0.0-rc.20');

  api.mainModule('src/payment-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb');
  api.use('unchained:core-payment');

  api.mainModule('tests/payment-index.test.ts');
});
