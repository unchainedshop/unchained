import { ProductCatalogPriceHelperTypes } from '@unchainedshop/types/products.js';

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
