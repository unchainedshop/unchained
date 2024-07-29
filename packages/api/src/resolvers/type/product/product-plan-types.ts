import { ProductPrice, Product as ProductType } from '@unchainedshop/core-products';
import { Context } from '@unchainedshop/api';
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
    }: { quantity?: number; currency?: string; useNetPrice?: boolean },
    requestContext: Context,
  ): Promise<ProductPrice> {
    const { countryContext, modules } = requestContext;
    const currency = forcedCurrencyCode || requestContext.currencyContext;

    return modules.products.prices.userPrice(
      obj,
      { quantity, userId: requestContext.userId, currency, country: countryContext, useNetPrice },
      requestContext,
    );
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
