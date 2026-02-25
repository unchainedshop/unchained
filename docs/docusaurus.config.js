// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: ' Unchained Engine',
  tagline: 'Headless Code-First E-Commerce SDK for Node.js',
  favicon: 'img/favicon-32x32.png',
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  // Set the production url of your site here
  url: 'https://docs.unchained.shop',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'unchainedshop', // Usually your GitHub org/user name.
  projectName: 'unchained', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
          editUrl: 'https://github.com/unchainedshop/unchained/tree/master/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],
  plugins: [
    [
      'docusaurus-plugin-llms',
      {
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        title: 'Unchained Engine',
        description:
          'Headless, code-first e-commerce SDK for Node.js with GraphQL API, MCP server for AI agents, and Admin UI Copilot.',
        docsDir: 'docs',
        excludeImports: true,
        removeDuplicateHeadings: true,
        rootContent: `## About Unchained Engine

Unchained Engine is an open-source, headless, code-first e-commerce SDK for Node.js. It provides a modular architecture where every component can be extended or replaced through a Director/Adapter plugin pattern.

### Package Hierarchy

- **@unchainedshop/platform** — Top-level orchestration, combines all packages
- **@unchainedshop/api** — GraphQL API layer (Express/Fastify adapters, GraphQL Yoga, MCP server)
- **@unchainedshop/core** — Business logic coordination across all domain modules
- **core-*** — Domain modules: orders, products, users, payment, delivery, assortments, filters, enrollments, warehousing, worker, files, events, countries, currencies, languages
- **@unchainedshop/plugins** — Payment, delivery, pricing, and warehousing adapters (Stripe, Datatrans, Cryptopay, etc.)
- **Infrastructure** — mongodb, events, logger, utils, roles, file-upload

### Key Entry Points

- **GraphQL API** — Primary interface for storefront and admin operations
- **MCP Server** — Model Context Protocol server enabling AI agents to manage products, orders, and more
- **Admin UI** — React-based back-office with built-in AI Copilot

### Plugin System

Plugins follow a Director/Adapter pattern: Directors manage collections of Adapters. Adapters are registered explicitly before platform startup. Available presets: base (essential), all (complete), crypto (cryptocurrency).

### Common Operations

- **Products**: CRUD, pricing, media, variations (configurable/bundle/plan types)
- **Orders**: Cart management, checkout, payment & delivery processing, lifecycle hooks
- **Payments**: Pluggable providers (Stripe, Datatrans, Braintree, Apple IAP, Cryptopay, Invoice)
- **Delivery**: Pluggable providers (Post, Send-Message, Stores)
- **Pricing**: Layered pricing pipeline with discount support
- **Assortments**: Hierarchical product categories with filters`,
      },
    ],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        disableSwitch: false,
        defaultMode: 'light',
      },

      navbar: {
        title: 'Unchained Engine',
        logo: {
          alt: 'Unchained Engine Logo',
          src: 'img/unchained-logomark.svg',
          srcDark: 'img/unchained-logomark-dark.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            type: 'docSidebar',
            sidebarId: 'guidesSidebar',
            position: 'left',
            label: 'Guides',
          },
          {
            type: 'docSidebar',
            sidebarId: 'adminUiSidebar',
            position: 'left',
            label: 'Admin UI',
          },
          {
            position: 'left',
            label: 'GraphQL Playground',
            href: 'https://engine.unchained.shop/graphql',
          },
          {
            href: 'https://github.com/unchainedshop/unchained/blob/master/CHANGELOG.md',
            label: 'Changelog',
            position: 'right',
          },
          {
            href: 'https://github.com/unchainedshop/unchained',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: 'https://unchained.shop',
            label: 'Website',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'light',
        links: [
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                // to: '/blog',
                href: 'https://unchained.shop/de/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/unchainedshop/unchained',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Unchained Commerce. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
