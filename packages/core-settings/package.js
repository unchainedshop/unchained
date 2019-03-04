Package.describe({
  name: 'unchained:core-settings',
  version: '0.23.0',
  // Brief, one-line summary of the package.
  summary: 'This package contains api to define settings for the unchained engine.',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md',
});

Npm.depends({
  'lodash.get': '4.4.2',
});

Package.onUse((api) => {
  api.versionsFrom('1.8.0.2');
  api.use('ecmascript');
  api.mainModule('core-settings.js');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('unchained:core-settings');
  api.mainModule('core-settings-tests.js');
});
