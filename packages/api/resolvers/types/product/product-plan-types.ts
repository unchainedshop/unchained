import {
  PlanProductHelperTypes,
  ProductPrice,
} from '@unchainedshop/types/products';
import { Product } from './product-types';

export const PlanProduct: PlanProductHelperTypes = {
  ...Product,

  catalogPrice: async (obj, { quantity, currency }, requestContext) => {
    const { modules, countryContext } = requestContext;
    return modules.products.prices.price(
      obj,
      {
        country: countryContext,
        currency,
        quantity,
      },
      requestContext
    );
  },

  simulatedPrice: async (
    obj,
    { currency, quantity, useNetPrice },
    requestContext
  ) => {
    const { countryContext, modules } = requestContext;
    return modules.products.prices.userPrice(
      obj,
      { quantity, currency, country: countryContext, useNetPrice },
      requestContext
    );
  },

  leveledCatalogPrices: async (obj, { currency }, requestContext) => {
    const { countryContext, modules } = requestContext;
    return modules.products.prices.catalogPricesLeveled(
      obj,
      { currency, country: countryContext },
      requestContext
    );
  },

  simulatedDiscounts: async () => {
    // const { modules, countryContext } = requestContext;
    // return modules.products.prices.userDiscounts(
    //   {
    //     quantity,
    //     country: countryContext,
    //   },
    //   requestContext
    // );
    return [] as Array<{
      _id: string;
      interface: any;
      total: ProductPrice;
    }>;
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
};
