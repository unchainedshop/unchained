/* globals Package */
Package.describe({
  name: 'unchained:core-documents',
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

  api.use('unchained:utils');
  api.use('unchained:core-logger');

  api.mainModule('documents.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-documents');
  api.mainModule('documents-tests.js');
});
