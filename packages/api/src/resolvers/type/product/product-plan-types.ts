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
    { quantity, currencyCode: forcedCurrencyCode }: { quantity?: number; currencyCode?: string },
    requestContext: Context,
  ): Promise<ProductPrice> {
    const { modules, countryContext } = requestContext;
    const currencyCode = forcedCurrencyCode || requestContext.currencyCode;
    return modules.products.prices.price(product, {
      country: countryContext,
      currencyCode,
      quantity,
    });
  },

  async simulatedPrice(
    obj: ProductType,
    {
      currencyCode: forcedCurrencyCode,
      quantity,
      useNetPrice,
      configuration,
    }: {
      quantity?: number;
      currencyCode?: string;
      useNetPrice?: boolean;
      configuration?: Array<ProductConfiguration>;
    },
    requestContext: Context,
  ): Promise<ProductPrice> {
    const { countryContext, user, services } = requestContext;
    const currencyCode = forcedCurrencyCode || requestContext.currencyCode;

    const pricingContext = {
      product: obj,
      user,
      country: countryContext,
      currencyCode,
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
      currencyCode: pricing.currencyCode,
    };
  },

  async leveledCatalogPrices(
    obj: ProductType,
    { currencyCode: forcedCurrencyCode }: { currencyCode?: string },
    requestContext: Context,
  ): Promise<
    Array<{
      minQuantity: number;
      maxQuantity: number;
      price: ProductPrice;
    }>
  > {
    const { countryContext, modules } = requestContext;
    const currencyCode = forcedCurrencyCode || requestContext.currencyCode;
    return modules.products.prices.catalogPricesLeveled(obj, { currencyCode, country: countryContext });
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
