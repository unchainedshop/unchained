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
    const { modules, countryCode } = requestContext;
    const currencyCode = forcedCurrencyCode || requestContext.currencyCode;
    return modules.products.prices.price(product, {
      countryCode,
      currencyCode,
      quantity,
    });
  },

  async simulatedPrice(
    product: ProductType,
    {
      currencyCode: forcedCurrencyCode,
      quantity,
      useNetPrice,
      configuration,
    }: {
      quantity?: number;
      currencyCode?: string;
      useNetPrice?: boolean;
      configuration?: ProductConfiguration[];
    },
    requestContext: Context,
  ): Promise<ProductPrice> {
    const { countryCode, user, services } = requestContext;
    const currencyCode = forcedCurrencyCode || requestContext.currencyCode;

    const pricingContext = {
      product,
      user,
      countryCode,
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
    product: ProductType,
    { currencyCode: forcedCurrencyCode }: { currencyCode?: string },
    requestContext: Context,
  ): Promise<
    {
      minQuantity: number;
      maxQuantity: number;
      price: ProductPrice;
    }[]
  > {
    const { countryCode, modules } = requestContext;
    const currencyCode = forcedCurrencyCode || requestContext.currencyCode;
    return modules.products.prices.catalogPricesLeveled(product, { currencyCode, countryCode });
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
