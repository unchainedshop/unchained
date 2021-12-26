import { ProductHelperTypes } from '@unchainedshop/types/products';
import { ProductTypes } from 'meteor/unchained:core-products';
import { objectInvert } from 'meteor/unchained:utils';

export const Product: ProductHelperTypes = {
  __resolveType: (obj) => {
    const invertedProductTypes = objectInvert(ProductTypes);
    return invertedProductTypes[obj.type];
  },

  assortmentPaths: async (obj, _, { modules }) => {
    return await modules.assortments.breadcrumbs({
      productId: obj._id as string,
    });
  },

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

  media: async (obj, params, { modules }) => {
    return await modules.products.media.findProductMedias({
      productId: obj._id as string,
      ...params,
    });
  },
};
