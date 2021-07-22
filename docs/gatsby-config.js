const themeOptions = require("@unchainedshop/gatsby-theme-apollo-docs/theme-options");

module.exports = {
  pathPrefix: "/docs/unchained",
  plugins: [
    {
      resolve: "@unchainedshop/gatsby-theme-apollo-docs",
      options: {
        ...themeOptions,
        root: __dirname,
        subtitle: "Unchained Engine",
        description: "A guide to using the Unchained Engine",
        githubRepo: "unchainedshop/unchained",
        defaultVersion: "2",
        // versions: {
        //   "1": "version-1"
        // },
        sidebarCategories: {
          null: [
            "index",
            "[Changelog](https://github.com/unchainedshop/unchained/releases)",
          ],
          "Getting Started": [
            "getting-started-engine-launch",
            "getting-started-storefront-setup",
            "getting-started-storefront-deploy",
            "getting-started-controlpanel-add-content",
          ],
          Installation: ["install-engine"],
          Deployment: [
            "deployment/deploy-engine-galaxy",
            "deployment/deploy-storefront-vercel",
            "deployment/amazon-documentdb",
            "deployment/docker-dev",
          ],
          Concepts: [
            "concepts/architecture",
            "concepts/carts",
            "concepts/search",
          ],
          Configuration: [
            "config/booting",
            "config/orders",
            "config/accounts",
            "config/assortments",
            "config/delivery",
            "config/files",
            "config/filters",
            "config/payment",
            "config/products",
            "config/pricing",
            "config/product-pricing",
            "config/email-template",
            "config/users",
            "config/subscriptions",
            "config/events",
            "config/settings",
          ],
          "API Reference": [
            "api/entities",
            "[GraphQL API Reference](https://docs.unchained.shop/api)",
            "[GraphQL API Playground](https://engine.unchained.shop/graphql)",
          ],
        },
      },
    },
  ],
};
