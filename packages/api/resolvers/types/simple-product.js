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
  async leveledCatalogPrices(obj, { currency }) {
    const prices = obj.catalogPrices();

    let previousMin = 0;
    const filteredAndSorted = prices
      .filter((p) => p.currencyCode === currency)
      .sort((a, b) => a.maxQuantity - b.maxQuantity);

    return filteredAndSorted.map((p, i) => {
      previousMin = p.maxQuantity;
      const max = filteredAndSorted[i + 1]
        ? filteredAndSorted[i + 1]?.maxQuantity
        : 100000000;
      const min = i === 0 ? 0 : previousMin;
      return {
        minQuantity: min,
        maxQuantity: i === 0 && p.maxQuantity > 0 ? p.maxQuantity : max,
        price: {
          isTaxable: p.isTaxable,
          isNetPrice: p.isNetPrice,
          amount: p.amount,
          currency: p.currencyCode,
        },
      };
    });
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
