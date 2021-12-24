import { ProductCatalogPriceHelperTypes } from '@unchainedshop/types/products';

export const ProductCatalogPrice: ProductCatalogPriceHelperTypes = {
  isTaxable: ({ isTaxable }) => {
    return isTaxable || false;
  },
  isNetPrice: ({ isNetPrice }) => {
    return isNetPrice || false;
  },
  country: async ({ countryCode }, _, { modules }) => {
    return await modules.countries.findCountry({ isoCode: countryCode });
  },
  currency: async ({ currencyCode }, _, { modules }) => {
    return await modules.currencies.findCurrency({ isoCode: currencyCode });
  },
};
