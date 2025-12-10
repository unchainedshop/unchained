import {
  ProductText,
  ProductStatus,
  Product as IProduct,
  ProductType,
} from '@unchainedshop/core-products';
import { SortOption } from '@unchainedshop/utils';
import { AssortmentPathLink } from '@unchainedshop/core-assortments';
import { ProductMedia } from '@unchainedshop/core-products';
import { ProductReview } from '@unchainedshop/core-products';
import { Context } from '../../../context.js';

export const Product = {
  __resolveType: (product: IProduct): string => {
    switch (product.type) {
      case ProductType.CONFIGURABLE_PRODUCT:
        return 'ConfigurableProduct';
      case ProductType.BUNDLE_PRODUCT:
        return 'BundleProduct';
      case ProductType.PLAN_PRODUCT:
        return 'PlanProduct';
      case ProductType.TOKENIZED_PRODUCT:
        return 'TokenizedProduct';
      default:
        return 'SimpleProduct';
    }
  },

  async proxies(product: IProduct, _: never, context: Context): Promise<IProduct[]> {
    return context.loaders.productProxiesLoader.load({ productId: product._id });
  },

  async assortmentPaths(
    product: IProduct,
    params: {
      forceLocale?: string;
    },
    { modules, loaders }: Context,
  ): Promise<
    {
      links: AssortmentPathLink[];
    }[]
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
    product: IProduct,
    params: {
      limit: number;
      offset: number;
      tags?: string[];
    },
    { loaders, modules }: Context,
  ): Promise<ProductMedia[]> {
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
    product: IProduct,
    {
      limit = 10,
      offset = 0,
      sort,
      queryString,
    }: {
      queryString?: string;
      limit?: number;
      offset?: number;
      sort?: SortOption[];
    },
    { modules }: Context,
  ): Promise<ProductReview[]> {
    return modules.products.reviews.findProductReviews({
      productId: product._id,
      limit,
      offset,
      sort,
      queryString,
    });
  },
  async reviewsCount(
    product: IProduct,
    params: {
      queryString?: string;
    },
    { modules }: Context,
  ): Promise<number> {
    return modules.products.reviews.count({ ...params, productId: product._id });
  },

  async siblings(
    product: IProduct,
    params: {
      assortmentId?: string;
      limit: number;
      offset: number;
      includeInactive: boolean;
    },
    { modules }: Context,
  ): Promise<(typeof product)[]> {
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

  status(product: IProduct, _, { modules }: Context): ProductStatus {
    return modules.products.normalizedStatus(product);
  },

  async texts(
    product: IProduct,
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
