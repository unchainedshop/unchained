import type {
  Product,
  ProductConfiguration,
  ProductPrice,
  ProductPriceRange,
} from '@unchainedshop/core-products';
import type { User } from '@unchainedshop/core-users';
import type { Modules } from '../modules.ts';
import { simulateProductPricingService } from './simulateProductPricing.ts';

export async function simulateConfigurablePriceRangeService(
  this: Modules,
  {
    product,
    currencyCode,
    countryCode,
    quantity = 1,
    useNetPrice = false,
    vectors,
    includeInactive = false,
    user,
  }: {
    product: Product;
    currencyCode: string;
    countryCode: string;
    quantity?: number;
    useNetPrice?: boolean;
    vectors?: ProductConfiguration[];
    includeInactive?: boolean;
    user?: User;
  },
): Promise<ProductPriceRange | null> {
  const products = await this.products.proxyProducts(product, vectors, {
    includeInactive,
  });

  const filteredPrices = (
    await Promise.all(
      products.map(async (proxyProduct) => {
        const pricing = await simulateProductPricingService.call(this, {
          product: proxyProduct,
          user,
          countryCode,
          discounts: [],
          currencyCode,
          quantity,
        });
        if (!pricing) return null;

        const unitPrice = pricing.unitPrice({ useNetPrice });

        return {
          ...unitPrice,
          isNetPrice: useNetPrice,
          isTaxable: pricing.taxSum() !== 0,
          currencyCode: pricing.currencyCode,
        };
      }),
    )
  ).filter(Boolean) as ProductPrice[];

  if (!filteredPrices.length) return null;

  const { minPrice, maxPrice } = this.products.prices.priceRange({
    productId: product._id as string,
    prices: filteredPrices,
  });

  return {
    minPrice,
    maxPrice,
  };
}
