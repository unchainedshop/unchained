import {
  Product as ProductType,
  ProductAssignment,
  ProductConfiguration,
  ProductPriceRange,
  ProductVariation,
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
    // TODO: use loader?
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
    const { countryContext, modules, services } = requestContext;
    const currency = forcedCurrencyCode || requestContext.currencyContext;

    const products = await modules.products.proxyProducts(product, vectors, {
      includeInactive,
    });

    const filteredPrices = (
      await Promise.all(
        products.map(async (proxyProduct) => {
          const pricingContext = {
            product: proxyProduct,
            user: requestContext.user,
            country: countryContext,
            currency,
            quantity,
          };

          const pricing = await services.products.simulateProductPricing(pricingContext);
          if (!pricing) return null;
          const unitPrice = pricing.unitPrice({ useNetPrice });

          return {
            ...unitPrice,
            isNetPrice: useNetPrice,
            isTaxable: pricing.taxSum() > 0,
            currencyCode: pricing.currency,
          };
        }),
      )
    ).filter(Boolean);

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
