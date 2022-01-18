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
      productId: obj._id,
    });
  },

  media: async (obj, params, { modules }) => {
    return await modules.products.media.findProductMedias({
      productId: obj._id,
      ...params,
    });
  },

  reviews: async (obj, { limit = 10, offset = 0 }, { modules }) => {
    return await modules.products.reviews.findProductReviews({
      productId: obj._id,
      limit,
      offset,
    });
  },

  siblings: async (product, params, { modules }) => {
    const { assortmentId, limit, offset, includeInactive = false } = params;

    const productId = product._id;
    const assortmentIds = assortmentId
      ? [assortmentId]
      : await modules.assortments.products.findAssortmentIds({ productId });

    if (!assortmentIds.length) return [];

    const productIds = await modules.assortments.products.findProductSiblings({
      productId,
      assortmentIds,
    });

    return await modules.products.findProductSiblings({
      productIds,
      includeInactive,
      limit,
      offset,
    });
  },

  status(obj, _, { modules }) {
    return modules.products.normalizedStatus(obj);
  },

  texts: async (obj, { forceLocale }, requestContext) => {
    const { localeContext, modules } = requestContext;
    return await modules.products.texts.findLocalizedText({
      productId: obj._id,
      locale: forceLocale || localeContext.normalized,
    });
  },
};
