import {
  Product as ProductType,
  ProductAssignment,
  ProductConfiguration,
  ProductPriceRange,
  ProductVariation,
  ProductPrice,
} from '@unchainedshop/core-products';
import { Context } from '../../../context.js';
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
    const { countryCode, modules, services } = requestContext;

    const currencyCode = forcedCurrencyCode || requestContext.currencyCode;

    const products = await modules.products.proxyProducts(product, vectors, {
      includeInactive,
    });

    const filteredPrices = (
      await Promise.all(
        products.map(async (proxyProduct) => {
          const pricingContext = {
            product: proxyProduct,
            user: requestContext.user,
            countryCode,
            discounts: [],
            currencyCode,
            quantity: quantity || 1,
          };

          const pricing = await services.products.simulateProductPricing(pricingContext);
          if (!pricing) return null;
          const unitPrice = pricing.unitPrice({ useNetPrice });

          return {
            ...unitPrice,
            isNetPrice: useNetPrice,
            isTaxable: pricing.taxSum() > 0,
            currencyCode: pricing.currencyCode,
          };
        }),
      )
    ).filter(Boolean) as ProductPrice[];

    if (!filteredPrices.length) return null;

    const { minPrice, maxPrice } = modules.products.prices.priceRange({
      productId: product._id as string,
      prices: filteredPrices,
    });

    return {
      minPrice,
      maxPrice,
    };
  },
};
