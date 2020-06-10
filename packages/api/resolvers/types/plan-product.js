export default {
  async texts(obj, { forceLocale }, requestContext) {
    const { localeContext } = requestContext;
    return obj.getLocalizedTexts(forceLocale || localeContext.normalized);
  },
  status(obj) {
    return obj.normalizedStatus();
  },
  async catalogPrice(obj, { quantity }, requestContext) {
    // listPrice: ProductPrice
    const { countryContext } = requestContext;
    return obj.price({
      country: countryContext,
      quantity,
    });
  },
  async simulatedPrice(obj, { quantity, useNetPrice }, requestContext) {
    const { countryContext, userId, user } = requestContext;
    return obj.userPrice(
      {
        quantity,
        country: countryContext,
        useNetPrice,
        userId,
        user,
      },
      requestContext,
    );
  },
  async simulatedDiscounts(obj, params, requestContext) {
    const { quantity } = params;
    const { countryContext, userId, user } = requestContext;
    return obj.userDiscounts(
      {
        quantity,
        country: countryContext,
        userId,
        user,
      },
      requestContext,
    );
  },
  salesUnit(obj) {
    return obj.commerce && obj.commerce.salesUnit;
  },
  salesQuantityPerUnit(obj) {
    return obj.commerce && obj.commerce.salesQuantityPerUnit;
  },
  async assortmentPaths(obj, { forceLocale }, { localeContext }) {
    return obj.assortmentPaths(forceLocale || localeContext.normalized);
  },
  async media(obj, props) {
    return obj.media(props);
  },
};
