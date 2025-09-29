import { Product, ProductConfiguration } from '@unchainedshop/core-products';
import { ProductPricingDirector } from '../core-index.js';
import { User } from '@unchainedshop/core-users';
import { Modules } from '../modules.js';
import { Order, OrderDiscount } from '@unchainedshop/core-orders';

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
