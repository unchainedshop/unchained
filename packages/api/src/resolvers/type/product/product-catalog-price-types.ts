import { Country } from '@unchainedshop/core-countries';
import { Currency } from '@unchainedshop/core-currencies';
import { ProductPrice } from '@unchainedshop/core-products';
import { Context } from '../../../context.js';

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
    // TODO: use loader
    return modules.countries.findCountry({ isoCode: countryCode });
  },
  currency: async ({ currencyCode }, _, { modules }) => {
    // TODO: use loader
    return modules.currencies.findCurrency({ isoCode: currencyCode });
  },
};
