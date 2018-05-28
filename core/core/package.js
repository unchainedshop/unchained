/* globals Package */
Package.describe({
  name: 'unchained:core',
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
  api.versionsFrom('1.7');

  api.use('ecmascript');
  api.use('promise');
  api.use('dburles:factory');
  api.use('ostrio:files');
  api.use('unchained:core-logger');
  api.use('unchained:core-countries');
  api.use('unchained:core-languages');

  api.mainModule('core.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core');
  api.mainModule('core-tests.js');
});
