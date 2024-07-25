import {
  Product as ProductType,
  ProductAssignment,
  ProductConfiguration,
  ProductPriceRange,
} from '@unchainedshop/types/products.js';
import { Context } from '@unchainedshop/api';
import { ProductVariation } from '@unchainedshop/types/products.variations.js';
import { Product } from './product-types.js';

export const ConfigurableProduct = {
  ...Product,

  async assignments(
    product: ProductType,
    params: {
      includeInactive: boolean;
    },
    { modules }: Context,
  ): Promise<
    Array<{
      assignment: ProductAssignment;
      product: typeof product;
    }>
  > {
    return modules.products.proxyAssignments(product, params);
  },

  async products(
    product: ProductType,
    {
      vectors,
      includeInactive,
    }: {
      vectors: Array<ProductConfiguration>;
      includeInactive: boolean;
    },
    { modules }: Context,
  ): Promise<Array<typeof product>> {
    return modules.products.proxyProducts(product, vectors, {
      includeInactive,
    });
  },

  async catalogPriceRange(
    product: ProductType,
    {
      quantity,
      vectors,
      currency: forcedCurrencyCode,
      includeInactive,
    }: {
      currency?: string;
      includeInactive: boolean;
      quantity: number;
      vectors: Array<ProductConfiguration>;
    },
    requestContext: Context,
  ): Promise<ProductPriceRange> {
    const { countryContext, modules } = requestContext;
    const currencyCode = forcedCurrencyCode || requestContext.currencyContext;
    return modules.products.prices.catalogPriceRange(product, {
      quantity,
      vectors,
      includeInactive,
      country: countryContext,
      currency: currencyCode,
    });
  },

  async variations(
    product: ProductType,
    {
      limit = 10,
      offset = 0,
    }: {
      limit: number;
      offset: number;
    },
    { modules }: Context,
  ): Promise<Array<ProductVariation>> {
    return modules.products.variations.findProductVariations({
      productId: product._id,
      limit,
      offset,
    });
  },

  async simulatedPriceRange(
    product: ProductType,
    {
      currency: forcedCurrencyCode,
      quantity,
      useNetPrice,
      vectors,
      includeInactive,
    }: {
      currency?: string;
      includeInactive: boolean;
      quantity?: number;
      vectors: Array<ProductConfiguration>;
      useNetPrice: boolean;
    },
    requestContext: Context,
  ): Promise<ProductPriceRange> {
    const { countryContext, modules } = requestContext;
    const currency = forcedCurrencyCode || requestContext.currencyContext;

    return modules.products.prices.simulatedPriceRange(
      product,
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
