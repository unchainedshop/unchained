const navConfig = {
  'Unchained Engine': {
    url: 'https://docs.unchained.shop',
    description: 'Learn how to use the Unchained Engine for your needs',
    omitLandingPage: true,
  },
  // 'Unchained Controlpanel': {
  //   url: 'https://docs.unchained.shop/controlpanel',
  //   description:
  //     'Configure a production-ready GraphQL server to fetch and combine data from multiple sources.',
  // },
};

const footerNavConfig = {
  // Blog: {
  //   href: 'https://blog.apollographql.com/',
  //   target: '_blank',
  //   rel: 'noopener noreferrer',
  // },
  Contribute: {
    href:
      'https://github.com/unchainedshop/unchained/blob/master/docs/contributing.md',
  },
  // 'GraphQL Summit': {
  //   href: 'https://summit.graphql.com/',
  //   target: '_blank',
  //   rel: 'noopener noreferrer',
  // },
};

module.exports = {
  siteName: 'Unchained Docs',
  pageTitle: 'Apollo GraphQL Docs',
  menuTitle: 'Unchained Platform',
  // gaTrackingId: 'UA-74643563-13',
  // algoliaApiKey: '768e823959d35bbd51e4b2439be13fb7',
  // algoliaIndexName: 'apollodata',
  baseUrl: 'https://docs.unchained.shop',
  twitterHandle: 'unchained_shop',
  spectrumHandle: 'unchained',
  // youtubeUrl: 'https://www.youtube.com/channel/UC0pEW_GOrMJ23l8QcrGdKSw',
  logoLink: 'https://docs.unchained.shop',
  baseDir: 'docs',
  contentDir: 'source',
  navConfig,
  footerNavConfig,
};
