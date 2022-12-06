import { ConfigurableProductHelperTypes } from '@unchainedshop/types/products';
import { Product } from './product-types';

export const ConfigurableProduct: ConfigurableProductHelperTypes = {
  ...Product,

  assignments: async (obj, params, { modules }) => {
    return modules.products.proxyAssignments(obj, params);
  },

  products: async (obj, { vectors, includeInactive }, { modules }) => {
    return modules.products.proxyProducts(obj, vectors, {
      includeInactive,
    });
  },

  catalogPriceRange: async (
    obj,
    { quantity, vectors, currency: forcedCurrencyCode, includeInactive },
    requestContext,
  ) => {
    const { countryContext, modules } = requestContext;
    const currencyCode =
      forcedCurrencyCode ||
      (await requestContext.services.countries.resolveDefaultCurrencyCode(
        {
          isoCode: countryContext,
        },
        requestContext,
      ));
    return modules.products.prices.catalogPriceRange(obj, {
      quantity,
      vectors,
      includeInactive,
      country: countryContext,
      currency: currencyCode,
    });
  },

  variations: async (obj, { limit = 10, offset = 0 }, { modules }) => {
    return modules.products.variations.findProductVariations({
      productId: obj._id,
      limit,
      offset,
    });
  },

  async simulatedPriceRange(
    obj,
    { currency: forcedCurrencyCode, quantity, useNetPrice, vectors, includeInactive },
    requestContext,
  ) {
    const { countryContext, modules } = requestContext;
    const currency =
      forcedCurrencyCode ||
      (await requestContext.services.countries.resolveDefaultCurrencyCode(
        {
          isoCode: countryContext,
        },
        requestContext,
      ));
    return modules.products.prices.simulatedPriceRange(
      obj,
      {
        quantity,
        currency,
        userId: requestContext.userId,
        country: countryContext,
        useNetPrice,
        vectors,
        includeInactive,
      },
      requestContext,
    );
  },
};
