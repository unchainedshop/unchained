import { ProductText, Product as ProductType } from '@unchainedshop/core-products';
import { ProductStatus, ProductTypes } from '@unchainedshop/core-products';
import { objectInvert } from '@unchainedshop/utils';
import { SortOption } from '@unchainedshop/utils';
import { AssortmentPathLink } from '@unchainedshop/core-assortments';
import { ProductMedia } from '@unchainedshop/core-products';
import { ProductReview } from '@unchainedshop/core-products';
import { Context } from '../../../context.js';

export const Product = {
  __resolveType: (product: ProductType): string => {
    const invertedProductTypes = objectInvert(ProductTypes);
    return invertedProductTypes[product.type];
  },

  async assortmentPaths(
    product: ProductType,
    params: {
      forceLocale?: string;
    },
    { modules, loaders }: Context,
  ): Promise<
    Array<{
      links: Array<AssortmentPathLink>;
    }>
  > {
    return modules.assortments.breadcrumbs(
      {
        productId: product._id,
      },
      {
        resolveAssortmentProducts: async (productId) =>
          loaders.assortmentProductsLoader.load({
            productId,
          }),
        resolveAssortmentLinks: async (childAssortmentId) =>
          loaders.assortmentLinksLoader.load({
            childAssortmentId,
          }),
      },
    );
  },

  async media(
    product: ProductType,
    params: {
      limit: number;
      offset: number;
      tags?: Array<string>;
    },
    { loaders, modules }: Context,
  ): Promise<Array<ProductMedia>> {
    if (params.offset || params.tags) {
      return modules.products.media.findProductMedias({
        productId: product._id,
        ...params,
      });
    }
    return (await loaders.productMediasLoader.load({ productId: product._id })).slice(
      params.offset,
      params.offset + params.limit,
    );
  },

  async reviews(
    product: ProductType,
    {
      limit = 10,
      offset = 0,
      sort,
      queryString,
    }: {
      queryString?: string;
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
    { modules }: Context,
  ): Promise<Array<ProductReview>> {
    return modules.products.reviews.findProductReviews({
      productId: product._id,
      limit,
      offset,
      sort,
      queryString,
    });
  },
  async reviewsCount(
    product: ProductType,
    params: {
      queryString?: string;
    },
    { modules }: Context,
  ): Promise<number> {
    return modules.products.reviews.count({ ...params, productId: product._id });
  },

  // TODO: slow!
  async siblings(
    product: ProductType,
    params: {
      assortmentId?: string;
      limit: number;
      offset: number;
      includeInactive: boolean;
    },
    { modules }: Context,
  ): Promise<Array<typeof product>> {
    const { assortmentId, limit, offset, includeInactive = false } = params;

    const productId = product._id;
    const assortmentIds = assortmentId
      ? [assortmentId]
      : await modules.assortments.products.findAssortmentIds({ productId });

    if (!assortmentIds.length) return [];

    const productIds = await modules.assortments.products.findSiblings({
      productId,
      assortmentIds,
    });

    return modules.products.findProducts({
      productIds,
      includeDrafts: includeInactive,
      limit,
      offset,
    });
  },

  status(product: ProductType, _, { modules }: Context): ProductStatus {
    return modules.products.normalizedStatus(product);
  },

  async texts(
    product: ProductType,
    {
      forceLocale,
    }: {
      forceLocale?: string;
    },
    { locale, loaders }: Context,
  ): Promise<ProductText> {
    return loaders.productTextLoader.load({
      productId: product._id,
      locale: forceLocale ? new Intl.Locale(forceLocale) : locale,
    });
  },
};
