import {
  Product as ProductType,
  ProductAssignment,
  ProductConfiguration,
  ProductPriceRange,
  ProductVariation,
} from '@unchainedshop/core-products';
import { Context } from '../../../context.js';
import { Product } from './product-types.js';
import { sha256 } from '@unchainedshop/utils';
import { ProductPricingDirector } from '@unchainedshop/core';

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

          const calculated = await ProductPricingDirector.rebuildCalculation(
            pricingContext,
            requestContext,
          );

          if (!calculated || !calculated.length) return null;

          const pricing = ProductPricingDirector.calculationSheet(pricingContext, calculated);
          const unitPrice = pricing.unitPrice({ useNetPrice });

          return {
            _id: await sha256(
              [
                proxyProduct._id,
                countryContext,
                quantity,
                useNetPrice,
                requestContext.userId || 'ANONYMOUS',
              ].join(''),
            ),
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
      _id: await sha256(
        [
          product._id,
          Math.random(),
          minPrice.amount,
          minPrice.currencyCode,
          maxPrice.amount,
          maxPrice.currencyCode,
        ].join(''),
      ),
      minPrice,
      maxPrice,
    };
  },
};
