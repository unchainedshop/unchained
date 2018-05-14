export default {
  texts(obj, { forceLocale }, { localeContext }) {
    return obj.getLocalizedTexts(forceLocale || localeContext.normalized);
  },
  status(obj) {
    return obj.normalizedStatus();
  },

  catalogPrice(obj, params, { countryContext }) {
    // listPrice: ProductPrice
    return obj.price({
      country: countryContext,
    });
  },
  simulatedPrice(obj, { quantity, useNetPrice }, { countryContext, userId }) {
    return obj.userPrice({
      quantity,
      country: countryContext,
      userId,
      useNetPrice,
    });
  },
  simulatedDiscounts(obj, { quantity }, { countryContext, userId }) {
    return obj.userDiscounts({
      quantity,
      country: countryContext,
      userId,
    });
  },
  simulatedDispatches(obj, { quantity, deliveryProviderType }, { countryContext, userId }) {
    return obj.userDispatches({
      quantity,
      deliveryProviderType,
      country: countryContext,
      userId,
    });
  },
  sku(obj) {
    return obj.warehousing && obj.warehousing.sku;
  },
  maxAllowedQuantityPerOrder(obj) {
    return obj.warehousing && obj.warehousing.maxAllowedQuantityPerOrder;
  },
  allowOrderingIfNoStock(obj) {
    return obj.warehousing && obj.warehousing.allowOrderingIfNoStock;
  },
  dimensions({ supply }) {
    if (!supply) return null;
    const {
      weightInGram, heightInMillimeters, lengthInMillimeters, widthInMillimeters,
    } = supply;
    return {
      weightInGram,
      heightInMillimeters,
      lengthInMillimeters,
      widthInMillimeters,
    };
  },
};
