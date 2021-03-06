export default {
  async texts(obj, { forceLocale }, requestContext) {
    const { localeContext } = requestContext;
    return obj.getLocalizedTexts(forceLocale || localeContext.normalized);
  },
  status(obj) {
    return obj.normalizedStatus();
  },
  async catalogPrice(obj, { quantity, currency }, requestContext) {
    const { countryContext } = requestContext;
    return obj.price({
      country: countryContext,
      currency,
      quantity,
    });
  },
  async simulatedPrice(
    obj,
    { currency, quantity, useNetPrice },
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
  async leveledCatalogPrices(obj, { currency }, requestContext) {
    const { countryContext } = requestContext;
    return obj.leveledCatalogPrices({ currency, country: countryContext });
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
      requestContext
    );
  },
  async simulatedDispatches(obj, params, requestContext) {
    const { referenceDate, quantity, deliveryProviderType } = params;
    const { countryContext, userId, user } = requestContext;
    return obj.userDispatches(
      {
        referenceDate,
        quantity,
        deliveryProviderType,
        country: countryContext,
        userId,
        user,
      },
      requestContext
    );
  },
  async simulatedStocks(obj, params, requestContext) {
    const { referenceDate, deliveryProviderType } = params;
    const { countryContext, userId, user } = requestContext;
    return obj.userStocks(
      {
        referenceDate,
        deliveryProviderType,
        country: countryContext,
        userId,
        user,
      },
      requestContext
    );
  },
  salesUnit(obj) {
    return obj.commerce && obj.commerce.salesUnit;
  },
  salesQuantityPerUnit(obj) {
    return obj.commerce && obj.commerce.salesQuantityPerUnit;
  },
  defaultOrderQuantity(obj) {
    return obj.commerce && obj.commerce.defaultOrderQuantity;
  },
  baseUnit(obj) {
    return obj.warehousing && obj.warehousing.baseUnit;
  },
  sku(obj) {
    return obj.warehousing && obj.warehousing.sku;
  },
  dimensions({ supply }) {
    if (!supply) return null;
    const {
      weightInGram,
      heightInMillimeters,
      lengthInMillimeters,
      widthInMillimeters,
    } = supply;
    return {
      weightInGram,
      heightInMillimeters,
      lengthInMillimeters,
      widthInMillimeters,
    };
  },
  async assortmentPaths(obj, { forceLocale }, { localeContext }) {
    return obj.assortmentPaths(forceLocale || localeContext.normalized);
  },
  async media(obj, props) {
    return obj.media(props);
  },
};
