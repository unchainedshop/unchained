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
    return obj.simulatedPriceRange(
      {
        quantity,
        currency,
        country: 'CH',
        useNetPrice,
        vectors,
        includeInactive,
        userId,
        user,
      },
      requestContext
    );
  },
};
