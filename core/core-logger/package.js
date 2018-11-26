/* globals Package */
Package.describe({
  name: 'unchained:core-logger',
  version: '0.15.0',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.8');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('dburles:factory');
  api.use('dburles:collection-helpers');

  api.use('unchained:utils');
  api.use('unchained:core-users', { unordered: true });
  api.use('unchained:core-orders', { unordered: true });

  api.mainModule('logger.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-logger');
  api.mainModule('logger-tests.js');
});
