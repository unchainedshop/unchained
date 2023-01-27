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
        sidebarCategories: {
          null: ['index', '[Changelog](https://github.com/unchainedshop/unchained/releases)'],
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
            'deployment/deploy-storefront-vercel',
            'deployment/amazon-documentdb',
          ],
          Concepts: ['concepts/architecture', 'concepts/carts', 'concepts/search'],
          Plugins: [
            'plugins/plugin-overview',
            'plugins/cryptopay',
            'plugins/datatrans',
            'plugins/postfinance-checkout',
            'plugins/twilio',
            'plugins/worldline-saferpay',
            'plugins/push-notification'
          ],
          Configuration: [
            'config/booting',
            'config/overview',
            'config/orders',
            'config/accounts',
            'config/assortments',
            'config/delivery',
            'config/files',
            'config/filters',
            'config/payment',
            'config/products',
            'config/quotations',
            'config/pricing',
            'config/email-template',
            'config/users',
            'config/enrollments',
          ],
          'Extending Unchained': [
            'advanced-config/overview',
            'advanced-config/delivery',
            'advanced-config/filter',
            'advanced-config/messaging',
            'advanced-config/order',
            'advanced-config/payment',
            'advanced-config/quotation',
            'advanced-config/warehousing',
            'advanced-config/worker',
            'advanced-config/custom-modules',
            'advanced-config/events',
            'advanced-config/entities',
            'advanced-config/extending-schema',
            'advanced-config/product-pricing',
            'advanced-config/extending-db',
            'advanced-config/admin-ui',
          ],
          'API Reference': [
            '[GraphQL API Reference](https://docs.unchained.shop/api)',
            '[GraphQL API Playground](https://engine.unchained.shop/graphql)',
            '[JS Reference](https://docs.unchained.shop/types)',
          ],
        },
      },
    },
  ],
};
