import { ProductPrice, Product as ProductType } from '@unchainedshop/types/products.js';
import { Context } from '@unchainedshop/types/api.js';
import { Product } from './product-types.js';

export const PlanProduct = {
  ...Product,

  async catalogPrice(
    product: ProductType,
    { quantity, currency: forcedCurrencyCode }: { quantity?: number; currency?: string },
    requestContext: Context,
  ): Promise<ProductPrice> {
    const { modules, countryContext } = requestContext;
    const currencyCode =
      forcedCurrencyCode ||
      (await requestContext.services.countries.resolveDefaultCurrencyCode(
        {
          isoCode: countryContext,
        },
        requestContext,
      ));
    return modules.products.prices.price(product, {
      country: countryContext,
      currency: currencyCode,
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
    const currency =
      forcedCurrencyCode ||
      (await requestContext.services.countries.resolveDefaultCurrencyCode(
        {
          isoCode: countryContext,
        },
        requestContext,
      ));
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
    const currency =
      forcedCurrencyCode ||
      (await requestContext.services.countries.resolveDefaultCurrencyCode(
        {
          isoCode: countryContext,
        },
        requestContext,
      ));
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
