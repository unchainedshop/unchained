export default {
  texts(obj, { forceLocale }, requestContext) {
    const { localeContext } = requestContext;
    return obj.getLocalizedTexts(forceLocale || localeContext.normalized);
  },
  status(obj) {
    return obj.normalizedStatus();
  },
  catalogPrice(obj, { quantity }, requestContext) {
    // listPrice: ProductPrice
    const { countryContext } = requestContext;
    return obj.price({
      country: countryContext,
      quantity
    });
  },
  simulatedPrice(obj, { quantity, useNetPrice }, requestContext) {
    const { countryContext, userId, user } = requestContext;
    return obj.userPrice(
      {
        quantity,
        country: countryContext,
        useNetPrice,
        userId,
        user
      },
      requestContext
    );
  },
  simulatedDiscounts(obj, params, requestContext) {
    const { quantity } = params;
    const { countryContext, userId, user } = requestContext;
    return obj.userDiscounts(
      {
        quantity,
        country: countryContext,
        userId,
        user
      },
      requestContext
    );
  },
  simulatedDispatches(obj, params, requestContext) {
    const { referenceDate, quantity, deliveryProviderType } = params;
    const { countryContext, userId, user } = requestContext;
    return obj.userDispatches(
      {
        referenceDate,
        quantity,
        deliveryProviderType,
        country: countryContext,
        userId,
        user
      },
      requestContext
    );
  },
  simulatedStocks(obj, params, requestContext) {
    const { referenceDate, deliveryProviderType } = params;
    const { countryContext, userId, user } = requestContext;
    return obj.userStocks(
      {
        referenceDate,
        deliveryProviderType,
        country: countryContext,
        userId,
        user
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
      widthInMillimeters
    } = supply;
    return {
      weightInGram,
      heightInMillimeters,
      lengthInMillimeters,
      widthInMillimeters
    };
  }
};
