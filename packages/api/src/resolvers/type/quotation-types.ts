import { Quotation as QuotationType } from '@unchainedshop/types/quotations.js';
import { Context } from '@unchainedshop/api';
import { User } from '@unchainedshop/core-users';
import { Product } from '@unchainedshop/types/products.js';
import { Country } from '@unchainedshop/core-countries';
import { Currency } from '@unchainedshop/core-currencies';

type HelperType<P, T> = (quotation: QuotationType, params: P, context: Context) => T;

type QuotationHelperTypes = {
  country: HelperType<never, Promise<Country>>;
  currency: HelperType<never, Promise<Currency>>;
  isExpired: HelperType<{ referenceDate: Date }, boolean>;
  status: HelperType<never, string>;
  product: HelperType<never, Promise<Product>>;
  user: HelperType<never, Promise<User>>;
};

export const Quotation: QuotationHelperTypes = {
  country: async (obj, _, { modules }) => modules.countries.findCountry({ isoCode: obj.countryCode }),

  currency: async (obj, _, { modules }) => modules.currencies.findCurrency({ isoCode: obj.currency }),

  isExpired: (obj, { referenceDate }, { modules }) =>
    modules.quotations.isExpired(obj, { referenceDate }),

  product: async (obj, _, { loaders }) => {
    const product = await loaders.productLoader.load({
      productId: obj.productId,
    });
    return product;
  },

  status: (obj, _, { modules }) => modules.quotations.normalizedStatus(obj),

  user: (obj, _, { modules }) => modules.users.findUserById(obj.userId),
};
