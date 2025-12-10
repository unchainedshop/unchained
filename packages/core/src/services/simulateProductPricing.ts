import type { Product, ProductConfiguration } from '@unchainedshop/core-products';
import { ProductPricingDirector } from '../core-index.ts';
import type { User } from '@unchainedshop/core-users';
import type { Modules } from '../modules.ts';
import type { Order, OrderDiscount } from '@unchainedshop/core-orders';

export async function simulateProductPricingService(
  this: Modules,
  pricingContext: {
    currencyCode: string;
    countryCode: string;
    quantity: number;
    discounts: OrderDiscount[];
    order?: Order;
    product: Product;
    configuration?: ProductConfiguration[];
    user?: User;
  },
) {
  const calculated = await ProductPricingDirector.rebuildCalculation(pricingContext, { modules: this });
  if (!calculated || !calculated.length) return null;
  return ProductPricingDirector.calculationSheet(pricingContext, calculated);
}
