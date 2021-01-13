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
  async catalogPriceRange(
    obj,
    { quantity, vectors, includeInactive },
    requestContext
  ) {
    const { countryContext } = requestContext;
    return obj.price({
      country: countryContext,
      quantity,
    });
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
