Package.describe({
  name: 'unchained:api',
  version: '1.0.0-beta8',
  summary: 'Unchained Engine: GraphQL API',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  accounting: '0.4.1',
  'lru-cache': '6.0.0',
  dataloader: '2.0.0',
  locale: '0.1.0',
  'lodash.isnumber': '3.0.3',
  'body-parser': '1.19.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');

  api.use('ecmascript');
  api.use('webapp');
  api.use('check');
  api.use('mongo');
  api.use('typescript@4.1.2');
  api.use('unchained:core@1.0.0-beta8');
  api.use('unchained:roles@1.0.0-beta8');

  api.mainModule('api.ts', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:api');
  api.mainModule('api-tests.js');
});
