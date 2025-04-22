import { Product, ProductConfiguration } from '@unchainedshop/core-products';
import { ProductPricingDirector } from '../core-index.js';
import { User } from '@unchainedshop/core-users';
import { Modules } from '../modules.js';

export async function simulateProductPricingService(
  this: Modules,
  pricingContext: {
    product: Product;
    user: User;
    countryCode: string;
    currencyCode: string;
    quantity: number;
    configuration?: Array<ProductConfiguration>;
  },
) {
  const calculated = await ProductPricingDirector.rebuildCalculation(pricingContext, { modules: this });
  if (!calculated || !calculated.length) return null;
  return ProductPricingDirector.calculationSheet(pricingContext, calculated);
}
