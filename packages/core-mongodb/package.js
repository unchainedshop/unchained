Package.describe({
  name: 'unchained:core-mongodb',
  version: '1.0.0-beta12',
  summary: 'Unchained Engine Core: MongoDB',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  '@accounts/mongo': '0.29.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('mongo');
  api.use('promise');
  api.use('typescript@4.1.2');
  api.mainModule('index.js');
});
