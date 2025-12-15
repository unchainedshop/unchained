import type {
  Product as ProductType,
  ProductAssignment,
  ProductConfiguration,
  ProductPriceRange,
  ProductVariation,
} from '@unchainedshop/core-products';
import type { Context } from '../../../context.ts';
import { Product } from './product-types.ts';

export const ConfigurableProduct = {
  ...Product,

  async assignments(
    product: ProductType,
    params: {
      includeInactive: boolean;
    },
    { modules }: Context,
  ): Promise<
    {
      assignment: ProductAssignment;
      product: typeof product;
    }[]
  > {
    return modules.products.proxyAssignments(product, params);
  },

  async products(
    product: ProductType,
    {
      vectors,
      includeInactive,
    }: {
      vectors: ProductConfiguration[];
      includeInactive: boolean;
    },
    { modules }: Context,
  ): Promise<(typeof product)[]> {
    return modules.products.proxyProducts(product, vectors, {
      includeInactive,
    });
  },

  async catalogPriceRange(
    product: ProductType,
    {
      quantity,
      vectors,
      currencyCode,
      includeInactive,
    }: {
      currencyCode?: string;
      includeInactive: boolean;
      quantity: number;
      vectors: ProductConfiguration[];
    },
    requestContext: Context,
  ): Promise<ProductPriceRange | null> {
    const { countryCode, modules } = requestContext;
    return modules.products.prices.catalogPriceRange(product, {
      quantity,
      vectors,
      includeInactive,
      countryCode,
      currencyCode: currencyCode || requestContext.currencyCode,
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
  ): Promise<ProductVariation[]> {
    return modules.products.variations.findProductVariations({
      productId: product._id,
      limit,
      offset,
    });
  },

  async simulatedPriceRange(
    product: ProductType,
    {
      currencyCode: forcedCurrencyCode,
      quantity,
      useNetPrice,
      vectors,
      includeInactive,
    }: {
      currencyCode?: string;
      includeInactive: boolean;
      quantity?: number;
      vectors: ProductConfiguration[];
      useNetPrice: boolean;
    },
    requestContext: Context,
  ): Promise<ProductPriceRange | null> {
    const { countryCode, services } = requestContext;
    const currencyCode = forcedCurrencyCode || requestContext.currencyCode;

    return services.products.simulateConfigurablePriceRange({
      product,
      currencyCode,
      countryCode,
      quantity,
      useNetPrice,
      vectors,
      includeInactive,
      user: requestContext.user,
    });
  },
};
