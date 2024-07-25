import { Country } from '@unchainedshop/types/countries.js';
import { Currency } from '@unchainedshop/types/currencies.js';
import { ProductPrice } from '@unchainedshop/types/products.js';
import { Context } from '../../../types.js';

export type ProductCatalogHelperType<P, T> = (
  productPrice: ProductPrice,
  params: P,
  context: Context,
) => T;

export interface ProductCatalogPriceHelperTypes {
  isTaxable: ProductCatalogHelperType<never, boolean>;

  isNetPrice: ProductCatalogHelperType<never, boolean>;

  country: ProductCatalogHelperType<never, Promise<Country>>;
  currency: ProductCatalogHelperType<never, Promise<Currency>>;
}

export const ProductCatalogPrice: ProductCatalogPriceHelperTypes = {
  isTaxable: ({ isTaxable }) => {
    return isTaxable || false;
  },
  isNetPrice: ({ isNetPrice }) => {
    return isNetPrice || false;
  },
  country: async ({ countryCode }, _, { modules }) => {
    return modules.countries.findCountry({ isoCode: countryCode });
  },
  currency: async ({ currencyCode }, _, { modules }) => {
    return modules.currencies.findCurrency({ isoCode: currencyCode });
  },
};
