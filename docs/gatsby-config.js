const themeOptions = require('@unchainedshop/gatsby-theme-apollo-docs/theme-options');

module.exports = {
  pathPrefix: '/docs/unchained',
  plugins: [
    {
      resolve: '@unchainedshop/gatsby-theme-apollo-docs',
      options: {
        ...themeOptions,
        navConfig: {
          ...themeOptions.navConfig,
          'Admin UI': {
            url: '/admin-ui/overview',
            description: 'Manage your application with a user friendly UI',
            omitLandingPage: false
          },
        },
        root: __dirname,
        subtitle: 'Unchained platform',
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
          Architecture: ['architecture/overview', 'architecture/services', 'architecture/carts', 'architecture/search',  'architecture/product-conversion-rates'],
          Configuration: [
            'config/booting',
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
            'config/enrollments',
          ],
          'Customization': [
            'advanced-config/overview',
            'advanced-config/messaging',
            'advanced-config/events',
            'advanced-config/custom-modules',
            'advanced-config/extending-schema',
            'advanced-config/extending-db',
            'advanced-config/bulk-import',
            'advanced-config/admin-ui',
          ],
          'Plugins': [
            'plugins/plugin-overview',
            'plugins/cryptopay',
            'plugins/datatrans',
            'plugins/postfinance-checkout',
            'plugins/twilio',
            'plugins/worldline-saferpay',
            'plugins/push-notification'
          ],
          'Write your own Plugins': [
            'write-plugins/delivery',
            'write-plugins/payment',
            'write-plugins/warehousing',
            'write-plugins/worker',
            'write-plugins/filter',
            'write-plugins/quotation',
            'write-plugins/product-pricing',
            'write-plugins/delivery-pricing',
            'write-plugins/payment-pricing',
            'write-plugins/order-pricing',
            'write-plugins/order-discounts',
            'write-plugins/event',
          ],
          'API Reference': [
            '[GraphQL API Reference](https://docs.unchained.shop/api)',
            '[GraphQL API Playground](https://engine.unchained.shop/graphql)',
            '[JS Reference](https://docs.unchained.shop/types)',
          ],
          'Admin-UI': [
            'admin-ui/overview',
            'admin-ui/authentication-and-registration',
            'admin-ui/order',
            'admin-ui/product',
            'admin-ui/assortment',
            'admin-ui/filter',
            'admin-ui/user',
            'admin-ui/currency',
            'admin-ui/country',
            'admin-ui/language',
            'admin-ui/delivery-provider',
            'admin-ui/payment-provider',
            'admin-ui/warehousing-provider',
            'admin-ui/work-queue',
            'admin-ui/event',
          ],
        },
      },
    },
  ],
};
