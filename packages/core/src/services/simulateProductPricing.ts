import { Product, ProductConfiguration } from '@unchainedshop/core-products';
import { ProductPricingDirector } from '../core-index.js';
import { User } from '@unchainedshop/core-users';
import { Modules } from '../modules.js';
import { resolveBestCurrency } from '@unchainedshop/utils';

export async function simulateProductPricingService(
  this: Modules,
  options: {
    product: Product;
    user: User;
    countryCode: string;
    currencyCode?: string;
    quantity: number;
    configuration?: Array<ProductConfiguration>;
  },
) {
  let currencyCode = options.currencyCode;
  if (!currencyCode) {
    const country = await this.countries.findCountry({ isoCode: options.countryCode });
    const currencies = await this.currencies.findCurrencies({ includeInactive: false });
    currencyCode = resolveBestCurrency(country.defaultCurrencyCode, currencies);
  }

  const pricingContext = {
    ...options,
    currencyCode,
  };

  const calculated = await ProductPricingDirector.rebuildCalculation(pricingContext, { modules: this });
  if (!calculated || !calculated.length) return null;
  return ProductPricingDirector.calculationSheet(pricingContext, calculated);
}
