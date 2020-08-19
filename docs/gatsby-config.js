const themeOptions = require('@unchainedshop/gatsby-theme-apollo-docs/theme-options');

module.exports = {
  pathPrefix: '/docs/unchained',
  plugins: [
    {
      resolve: '@unchainedshop/gatsby-theme-apollo-docs',
      options: {
        ...themeOptions,
        root: __dirname,
        subtitle: 'Unchained Engine',
        description: 'A guide to using Unchained Engine',
        githubRepo: 'unchainedshop/unchained',
        defaultVersion: '2',
        // versions: {
        //   "1": "version-1"
        // },
        sidebarCategories: {
          null: [
            'index',
            'getting-started',
            '[Changelog](https://github.com/unchainedshop/unchained/releases)',
          ],
          'Extending the API': [
            'schema/schema',
            'schema/scalars-enums',
            'schema/unions-interfaces',
            'schema/directives',
            'schema/creating-directives',
          ],
          'Fetching Data': [
            'data/resolvers',
            'data/data-sources',
            'data/errors',
            'data/file-uploads',
            'data/subscriptions',
          ],
          'API Reference': ['api/unchained'],
          Appendices: [],
        },
      },
    },
  ],
};
