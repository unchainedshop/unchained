Package.describe({
  name: 'unchained:core-files',
  version: '0.22.0',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.8.0.2');
  api.use('ostrio:files@1.9.11');
  api.use('ecmascript');
  api.mainModule('core-files.js');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('core-files');
  api.mainModule('core-files-tests.js');
});
