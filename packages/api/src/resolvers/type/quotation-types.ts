import { Quotation as QuotationType } from '@unchainedshop/types/quotations';
import { Context } from '@unchainedshop/types/api';
import { User } from '@unchainedshop/types/user';
import { Product } from '@unchainedshop/types/products';
import { Country } from '@unchainedshop/types/countries';
import { Currency } from '@unchainedshop/types/currencies';

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

  product: (obj, _, { modules }) =>
    modules.products.findProduct({
      productId: obj.productId,
    }),

  status: (obj, _, { modules }) => modules.quotations.normalizedStatus(obj),

  user: (obj, _, { modules }) => modules.users.findUserById(obj.userId),
};
