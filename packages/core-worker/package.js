Package.describe({
  name: 'unchained:core-worker',
  version: '0.61.4',
  summary: 'Unchained Engine Core: Worker',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.11.1');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('email');

  api.use('typescript@4.1.2');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.2.1');
  api.use('littledata:synced-cron@1.5.1');
  api.use('percolate:migrations@1.0.2');
  api.use('unchained:core-logger@0.61.0');
  api.use('unchained:utils@0.61.0');

  api.mainModule('worker.js', 'server');
});
