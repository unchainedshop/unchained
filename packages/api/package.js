Package.describe({
  name: 'unchained:api',
  version: '1.0.0-rc.10',
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
  // 'graphql-scalars': '1.9.0', // needs to be peer dep!
});

Package.onUse((api) => {
  api.versionsFrom('2.6.1');

  api.use('ecmascript');
  api.use('webapp');
  api.use('check');
  api.use('typescript');

  api.use('unchained:events@1.0.0-rc.10.1');
  api.use('unchained:logger@1.0.0-rc.10');

  api.use('unchained:core@1.0.0-rc.10');
  api.use('unchained:roles@1.0.0-rc.10');

  api.mainModule('api.ts', 'server');
});
