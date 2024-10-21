// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: ' Unchained',
  tagline: 'Dinosaurs are cool',
  favicon: 'img/favicon.ico',

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
  onBrokenMarkdownLinks: 'warn',

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
          routeBasePath: '/', // Serve the docs at the site's root
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/unchainedshop/unchained/tree/main/packages/create-docusaurus/templates/shared/',
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
      require.resolve("@easyops-cn/docusaurus-search-local"),
      ({
        hashed: true,
        docsRouteBasePath: "/"
      }),
    ],
     [
      
        "@graphql-markdown/docusaurus",
        /** @type {import('@graphql-markdown/types').ConfigOptions} */
        {
          // ... other options
          loaders: {
            GraphQLFileLoader: "@graphql-tools/graphql-file-loader"
          }
        },
      ],
    ],
   
 


  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        disableSwitch: true,
        defaultMode: 'light'
      },
      navbar: {
        title: 'Unchained Engine',
        logo: {
          alt: 'my site Logo',
          src: 'img/unchained-logomark copy.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            href: 'https://github.com/unchainedshop/unchained',
            label: 'GitHub',
            position: 'right',
          },         
          // {
          //   to: "/swapi/homepage", // adjust the location depending on your baseURL (see configuration)
          //   label: "GraphQL API", // change the label with yours
          //   position: "left",
          //   id: 'schema',
          // },
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
                href:'https://unchained.shop/de/blog'
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
