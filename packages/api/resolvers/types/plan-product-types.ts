import {
  PlanProductHelperTypes,
  ProductPrice,
} from '@unchainedshop/types/products';

export const PlanProduct: PlanProductHelperTypes = {
  texts: async (obj, { forceLocale }, requestContext) => {
    const { localeContext, modules } = requestContext;
    return await modules.products.texts.findLocalizedText({
      productId: obj._id as string,
      locale: forceLocale || localeContext.normalized,
    });
  },

  status(obj, _, { modules }) {
    return modules.products.normalizedStatus(obj);
  },

  catalogPrice: async (obj, { quantity, currency }, requestContext) => {
    const { modules, countryContext } = requestContext;
    return await modules.products.prices.price(
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
    return await modules.products.prices.userPrice(
      obj,
      { quantity, currency, country: countryContext, useNetPrice },
      requestContext
    );
  },

  leveledCatalogPrices: async (obj, { currency }, requestContext) => {
    const { countryContext, modules } = requestContext;
    return await modules.products.prices.catalogPricesLeveled(
      obj,
      { currency, country: countryContext },
      requestContext
    );
  },

  simulatedDiscounts: async (obj, { quantity }, requestContext) => {
    // const { modules, countryContext } = requestContext;
    // return await modules.products.prices.userDiscounts(
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
  // assortmentPaths: async (obj, { forceLocale }, { modules, localeContext }) => {
  //   return modules.assortments.breadcrumbs(  (forceLocale || localeContext.normalized);
  // },

  media: async (obj, params, { modules }) => {
    return await modules.products.media.findProductMedias({
      productId: obj._id as string,
      ...params,
    });
  },
};
