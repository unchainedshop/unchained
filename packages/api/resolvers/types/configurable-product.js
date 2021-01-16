import { log } from 'meteor/unchained:core-logger';

export default {
  async texts(obj, { forceLocale }, { localeContext }) {
    return obj.getLocalizedTexts(forceLocale || localeContext.normalized);
  },
  status(obj) {
    return obj.normalizedStatus();
  },
  assignments(obj, { includeInactive }) {
    return obj.proxyAssignments({ includeInactive });
  },
  async products(obj, { vectors = [], includeInactive } = {}) {
    return obj.proxyProducts(vectors, { includeInactive });
  },
  async assortmentPaths(obj, { forceLocale }, { localeContext }) {
    return obj.assortmentPaths(forceLocale || localeContext.normalized);
  },
  async media(obj, props) {
    return obj.media(props);
  },
  async catalogPriceRange(obj, { quantity, vectors, includeInactive }) {
    return obj.catalogPriceRange({ quantity, vectors, includeInactive });
  },
  async simulatedPriceRange(
    obj,
    { currency, quantity, useNetPrice, vectors, includeInactive },
    requestContext
  ) {
    const { countryContext, userId, user } = requestContext;
    return obj.userPrice(
      {
        quantity,
        currency,
        country: countryContext,
        useNetPrice,
        userId,
        user,
      },
      requestContext
    );
  },
};

const x = [
  {
    _id: 'WHHknqTGCSojXGBPf',
    created: '2021-01-13T23:30:06.158Z',
    type: 'SIMPLE_PRODUCT',
    status: 'ACTIVE',
    sequence: 10,
    authorId: 'zR8IsXNuMMBLTgako',
    slugs: ['color-red'],
    updated: '2021-01-16T17:08:56.749Z',
    commerce: {
      pricing: [
        {
          amount: 50000,
          maxQuantity: 0,
          isTaxable: true,
          isNetPrice: false,
          currencyCode: 'EUR',
          countryCode: 'CH',
        },
        {
          amount: 100000,
          maxQuantity: 7,
          isTaxable: false,
          isNetPrice: false,
          currencyCode: 'EUR',
          countryCode: 'CH',
        },
      ],
    },
    published: '2021-01-13T23:31:00.422Z',
  },
  {
    _id: 'pamzgfhv6kWsgu4NP',
    created: '2021-01-13T23:31:22.135Z',
    type: 'SIMPLE_PRODUCT',
    status: 'ACTIVE',
    sequence: 11,
    authorId: 'zR8IsXNuMMBLTgako',
    slugs: ['color-red-1'],
    updated: '2021-01-13T23:31:46.369Z',
    published: '2021-01-13T23:31:25.898Z',
    commerce: {
      pricing: [
        {
          amount: 20,
          maxQuantity: 0,
          isTaxable: true,
          isNetPrice: false,
          currencyCode: 'EUR',
          countryCode: 'CH',
        },
      ],
    },
  },
];
