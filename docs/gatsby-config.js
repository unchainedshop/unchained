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
        description: 'A guide to using the Unchained Engine',
        githubRepo: 'unchainedshop/unchained',
        defaultVersion: '2',
        // versions: {
        //   "1": "version-1"
        // },
        sidebarCategories: {
          null: [
            'index',
            '[Changelog](https://github.com/unchainedshop/unchained/releases)',
          ],
          'Installation (cloud)': [
            'getting-started/engine-launch',
            'getting-started/storefront-setup',
            'getting-started/engine-controlpanel',
            'getting-started/storefront-deploy',
          ],
          'Installation (local)': [
            'installation/install-engine',
            'installation/install-storefront',
            'installation/run-engine-docker',
          ],
          Deployment: [
            'deployment/deploy-engine-galaxy',
            'deployment/deploy-storefront-vercel',
            'deployment/amazon-documentdb',
          ],
          Concepts: [
            'concepts/architecture',
            'concepts/carts',
            'concepts/search',
          ],
          Plugins: ['plugins/plugin-overview'],
          Configuration: [
            'config/booting',
            'config/orders',
            'config/accounts',
            'config/assortments',
            'config/delivery',
            'config/extending-schema',
            'config/files',
            'config/filters',
            'config/payment',
            'config/products',
            'config/quotations',
            'config/pricing',
            'config/product-pricing',
            'config/email-template',
            'config/users',
            'config/enrollments',
            'config/events',
          ],
          'API Reference': [
            'api/entities',
            '[GraphQL API Reference](https://docs.unchained.shop/api)',
            '[GraphQL API Playground](https://engine.unchained.shop/graphql)',
            '[JS Reference](https://docs.unchained.shop/types)',
          ],
        },
      },
    },
  ],
};
