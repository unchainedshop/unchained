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

  catalogPriceRange: async (obj, { quantity, vectors, currency, includeInactive }, requestContext) => {
    const { countryContext, modules } = requestContext;

    return modules.products.prices.catalogPriceRange(
      obj,
      {
        quantity,
        vectors,
        includeInactive,
        country: countryContext,
        currency,
      },
      requestContext,
    );
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
    { currency, quantity, useNetPrice, vectors, includeInactive },
    requestContext,
  ) {
    const { countryContext, modules } = requestContext;
    return modules.products.prices.simulatedPriceRange(
      obj,
      {
        quantity,
        currency,
        country: countryContext,
        useNetPrice,
        vectors,
        includeInactive,
      },
      requestContext,
    );
  },
};
