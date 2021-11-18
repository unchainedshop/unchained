Package.describe({
  name: 'unchained:core-eventhistory',
  version: '1.0.0-beta15',
  summary: 'Unchained Engine: Event History',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  redis: '3.0.2',
  'simpl-schema': '1.12.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('typescript@4.1.2');

  api.use('unchained:events@1.0.0-beta15');
  api.use('unchained:utils@1.0.0-beta15');

  api.mainModule('src/eventhistory-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript@4.1.2');
  
  api.use('unchained:mongodb@1.0.0-beta15');
  api.use('unchained:core-eventhistory@1.0.0-beta15');

  api.mainModule('test/eventhistory-index.test.ts');
});
