import { PlanProductHelperTypes, ProductPrice } from '@unchainedshop/types/products';
import { Product } from './product-types';

export const PlanProduct: PlanProductHelperTypes = {
  ...Product,

  catalogPrice: async (product, { quantity, currency: forcedCurrencyCode }, requestContext) => {
    const { modules, countryContext } = requestContext;
    const currencyCode =
      forcedCurrencyCode ||
      (await requestContext.services.countries.resolveDefaultCurrencyCode(
        {
          isoCode: countryContext,
        },
        requestContext,
      ));
    return modules.products.prices.price(product, {
      country: countryContext,
      currency: currencyCode,
      quantity,
    });
  },

  simulatedPrice: async (
    obj,
    { currency: forcedCurrencyCode, quantity, useNetPrice },
    requestContext,
  ) => {
    const { countryContext, modules } = requestContext;
    const currency =
      forcedCurrencyCode ||
      (await requestContext.services.countries.resolveDefaultCurrencyCode(
        {
          isoCode: countryContext,
        },
        requestContext,
      ));
    return modules.products.prices.userPrice(
      obj,
      { quantity, currency, country: countryContext, useNetPrice },
      requestContext,
    );
  },

  leveledCatalogPrices: async (obj, { currency: forcedCurrencyCode }, requestContext) => {
    const { countryContext, modules } = requestContext;
    const currency =
      forcedCurrencyCode ||
      (await requestContext.services.countries.resolveDefaultCurrencyCode(
        {
          isoCode: countryContext,
        },
        requestContext,
      ));
    return modules.products.prices.catalogPricesLeveled(obj, { currency, country: countryContext });
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
