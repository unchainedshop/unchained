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
          Concepts: [
            'concepts/architecture',
            'concepts/carts',
            'concepts/search',
          ],
          Configuration: [
            'config/booting',
            'config/assortments',
            'config/delivery',
            'config/files',
            'config/filters',
            'config/payment',
            'config/products',
            'config/settings',
          ],
          Deployment: ['deployment/amazon-documentdb', 'deployment/docker-dev'],
          'API Reference': [
            'api/entities',
            '[GraphQL API Reference](https://docs.unchained.shop/api)',
            '[GraphQL API Playground](https://engine.unchained.shop/graphql)',
          ],
        },
      },
    },
  ],
};
