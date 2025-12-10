import type { Country } from '@unchainedshop/core-countries';
import type { Currency } from '@unchainedshop/core-currencies';
import type { ProductPrice } from '@unchainedshop/core-products';
import type { Context } from '../../../context.ts';

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
  country: async ({ countryCode }, _, { loaders }) => {
    return loaders.countryLoader.load({ isoCode: countryCode });
  },
  currency: async ({ currencyCode }, _, { loaders }) => {
    return loaders.currencyLoader.load({ isoCode: currencyCode });
  },
};
