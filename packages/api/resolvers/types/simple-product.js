import { Users } from "meteor/unchained:core-users";

export default {
  texts(obj, { forceLocale }, { localeContext }) {
    return obj.getLocalizedTexts(forceLocale || localeContext.normalized);
  },
  status(obj) {
    return obj.normalizedStatus();
  },
  catalogPrice(obj, { quantity }, { countryContext }) {
    // listPrice: ProductPrice
    return obj.price({
      country: countryContext,
      quantity
    });
  },
  simulatedPrice(obj, { quantity, useNetPrice }, { countryContext, userId }) {
    const user = Users.findOne({ _id: userId });
    return obj.userPrice({
      quantity,
      country: countryContext,
      user,
      useNetPrice
    });
  },
  simulatedDiscounts(obj, { quantity }, { countryContext, userId }) {
    return obj.userDiscounts({
      quantity,
      country: countryContext,
      userId
    });
  },
  simulatedDispatches(
    obj,
    { referenceDate, quantity, deliveryProviderType },
    { countryContext, userId }
  ) {
    return obj.userDispatches({
      referenceDate,
      quantity,
      deliveryProviderType,
      country: countryContext,
      userId
    });
  },
  simulatedStocks(
    obj,
    { referenceDate, deliveryProviderType },
    { countryContext, userId }
  ) {
    return obj.userStocks({
      referenceDate,
      deliveryProviderType,
      country: countryContext,
      userId
    });
  },
  salesUnit(obj) {
    return obj.commerce && obj.commerce.salesUnit;
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
