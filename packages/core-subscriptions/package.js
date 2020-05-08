Package.describe({
  name: 'unchained:core-subscriptions',
  version: '0.48.0',
  summary: 'Unchained Engine Core: Subscriptions',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  hashids: '2.2.1',
});

Package.onUse((api) => {
  api.versionsFrom('1.10');
  api.use('ecmascript');
  api.use('mongo');
  api.use('dburles:factory@1.1.0');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.0.2');
  api.use('aldeed:schema-index@3.0.0');

  api.use('unchained:core-files@0.48.0');
  api.use('unchained:core@0.48.0');
  api.use('unchained:utils@0.48.0');
  api.use('unchained:core-worker@0.48.0');
  api.use('unchained:core-users@0.48.0');
  api.use('unchained:core-products@0.48.0');
  api.use('unchained:core-countries@0.48.0');
  api.use('unchained:core-logger@0.48.0');
  api.use('unchained:core-messaging@0.48.0');

  api.mainModule('subscriptions.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-subscriptions');
  api.mainModule('subscriptions-tests.js');
});
