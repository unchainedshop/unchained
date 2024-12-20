import {
  ProductConfiguration,
  ProductPrice,
  Product as ProductType,
} from '@unchainedshop/core-products';
import { Context } from '../../../context.js';
import { Product } from './product-types.js';

export const PlanProduct = {
  ...Product,

  async catalogPrice(
    product: ProductType,
    { quantity, currency: forcedCurrencyCode }: { quantity?: number; currency?: string },
    requestContext: Context,
  ): Promise<ProductPrice> {
    const { modules, countryContext } = requestContext;
    const currency = forcedCurrencyCode || requestContext.currencyContext;
    return modules.products.prices.price(product, {
      country: countryContext,
      currency,
      quantity,
    });
  },

  async simulatedPrice(
    obj: ProductType,
    {
      currency: forcedCurrencyCode,
      quantity,
      useNetPrice,
      configuration,
    }: {
      quantity?: number;
      currency?: string;
      useNetPrice?: boolean;
      configuration?: Array<ProductConfiguration>;
    },
    requestContext: Context,
  ): Promise<ProductPrice> {
    const { countryContext, user, services } = requestContext;
    const currency = forcedCurrencyCode || requestContext.currencyContext;

    const pricingContext = {
      product: obj,
      user,
      country: countryContext,
      currency,
      quantity,
      configuration,
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
  },

  async leveledCatalogPrices(
    obj: ProductType,
    { currency: forcedCurrencyCode }: { currency?: string },
    requestContext: Context,
  ): Promise<
    Array<{
      minQuantity: number;
      maxQuantity: number;
      price: ProductPrice;
    }>
  > {
    const { countryContext, modules } = requestContext;
    const currency = forcedCurrencyCode || requestContext.currencyContext;
    return modules.products.prices.catalogPricesLeveled(obj, { currency, country: countryContext });
  },

  salesUnit({ commerce }: ProductType): string {
    return commerce?.salesUnit;
  },
  salesQuantityPerUnit({ commerce }: ProductType): string {
    return commerce?.salesQuantityPerUnit;
  },
  defaultOrderQuantity({ commerce }: ProductType): number {
    return commerce?.defaultOrderQuantity;
  },
};
