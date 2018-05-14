/* globals Package */
Package.describe({
  name: 'unchained:platform',
  version: '0.1.0',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.6.1');

  api.use('ecmascript');
  api.use('random');
  api.use('check');
  api.use('accounts-base');
  api.use('aldeed:collection2');
  api.use('aldeed:schema-index');
  api.use('unchained:core');
  api.use('unchained:core-avatars');
  api.use('unchained:core-currencies');
  api.use('unchained:core-countries');
  api.use('unchained:core-delivery');
  api.use('unchained:core-discounting');
  api.use('unchained:core-documents');
  api.use('unchained:core-languages');
  api.use('unchained:core-logger');
  api.use('unchained:core-messaging');
  api.use('unchained:core-orders');
  api.use('unchained:core-payment');
  api.use('unchained:core-pricing');
  api.use('unchained:core-products');
  api.use('unchained:core-users');
  api.use('unchained:core-warehousing');
  api.use('unchained:api');

  api.mainModule('platform.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:platform');
  api.mainModule('platform-tests.js');
});
