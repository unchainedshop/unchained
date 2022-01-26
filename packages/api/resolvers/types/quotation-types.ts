import { Quotation as QuotationType } from '@unchainedshop/types/quotations';
import { Context } from '@unchainedshop/types/api';
import { User } from '@unchainedshop/types/user';
import { Product } from '@unchainedshop/types/products';
import { Country } from '@unchainedshop/types/countries';
import { Currency } from '@unchainedshop/types/currencies';
import { File } from '@unchainedshop/types/files';

type HelperType<P, T> = (
  quotation: QuotationType,
  params: P,
  context: Context
) => T;

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
  country: async (obj, _, { modules }) => {
    return modules.countries.findCountry({ isoCode: obj.countryCode });
  },

  currency: async (obj, _, { modules }) => {
    return modules.currencies.findCurrency({ isoCode: obj.currency });
  },

  documents: async (obj, { type }, { modules }) => {
    return modules.files.findFilesByMetaData(
      {
        meta: {
          quotationId: obj._id,
        },
      },
      {
        sort: {
          'meta.date': -1,
        },
      }
    );
  },

  isExpired: (obj, { referenceDate }, { modules }) => {
    return modules.quotations.isExpired(obj, { referenceDate });
  },

  product: async (obj, _, { modules }) => {
    return modules.products.findProduct({
      productId: obj.productId,
    });
  },

  status: (obj, _, { modules }) => {
    return modules.quotations.normalizedStatus(obj);
  },

  user: async (obj, _, { modules }) => {
    return modules.users.findUser({
      userId: obj.userId,
    });
  },
};
