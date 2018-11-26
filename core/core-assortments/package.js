/* globals Package */
Package.describe({
  name: 'unchained:core-assortments',
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
  api.use('dburles:factory');
  api.use('dburles:collection-helpers');

  api.use('unchained:utils');
  api.use('unchained:core-currencies');
  api.use('unchained:core-filters');

  api.mainModule('assortments.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-assortments');
  api.mainModule('assortments-tests.js');
});
