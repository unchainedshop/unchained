import { Quotation as QuotationType } from '@unchainedshop/types/quotations';
import { Context } from '@unchainedshop/types/api';
import { User } from '@unchainedshop/types/user';
import { Product } from '@unchainedshop/types/products';
import { Country } from '@unchainedshop/types/countries';
import { Currency } from '@unchainedshop/types/currencies';
import { File } from '@unchainedshop/types/files';

type HelperType<P, T> = (quotation: QuotationType, params: P, context: Context) => T;

type QuotationHelperTypes = {
  country: HelperType<never, Promise<Country>>;
  currency: HelperType<never, Promise<Currency>>;
  documents: HelperType<{ type: string }, Promise<Array<File>>>;
  isExpired: HelperType<{ referenceDate: Date }, boolean>;
  status: HelperType<never, string>;
  product: HelperType<never, Promise<Product>>;
  user: HelperType<never, Promise<User>>;
};

export const Quotation: QuotationHelperTypes = {
  country: async (obj, _, { modules }) => modules.countries.findCountry({ isoCode: obj.countryCode }),

  currency: async (obj, _, { modules }) => modules.currencies.findCurrency({ isoCode: obj.currency }),

  documents: (obj, { type }, { modules }) =>
    modules.files.findFilesByMetaData(
      {
        meta: {
          quotationId: obj._id,
          type,
        },
      },
      {
        sort: {
          'meta.date': -1,
        },
      },
    ),

  isExpired: (obj, { referenceDate }, { modules }) =>
    modules.quotations.isExpired(obj, { referenceDate }),

  product: async (obj, _, { loaders }) => {
    const product = await loaders.productLoader.load({
      productId: obj.productId,
      includeDrafts: true,
    });
    return product;
  },

  status: (obj, _, { modules }) => modules.quotations.normalizedStatus(obj),

  user: (obj, _, { modules }) => modules.users.findUserById(obj.userId),
};
