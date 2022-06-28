Package.describe({
  name: 'unchained:api',
  version: '1.1.3',
  summary: 'Unchained Engine: GraphQL API',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  accounting: '0.4.1',
  'lru-cache': '7.7.0',
  'abort-controller': '3.0.0',
  dataloader: '2.0.0',
  locale: '0.1.0',
  'lodash.isnumber': '3.0.3',
  'body-parser': '1.19.0',
  '@unchainedshop/logger': '1.1.3',
  '@unchainedshop/roles': '1.1.3',
  '@unchainedshop/utils': '1.1.3',
  '@unchainedshop/events': '1.1.4',
  // 'graphql-scalars': '1.9.0', // needs to be peer dep!
  // graphql peer dep
  // apollo-server-express peer dep
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');

  api.use('ecmascript');
  api.use('webapp');
  api.use('check');
  api.use('typescript');

  api.use('unchained:core@1.1.3');

  api.mainModule('src/api-index.ts', 'server');
});
