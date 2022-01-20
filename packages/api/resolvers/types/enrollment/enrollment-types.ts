import { Context } from '@unchainedshop/types/api';
import { Country } from '@unchainedshop/types/countries';
import { Currency } from '@unchainedshop/types/currencies';
import {
  EnrollmentPlan,
  Enrollment as EnrollmentType,
} from '@unchainedshop/types/enrollments';
import { Product } from '@unchainedshop/types/products';
import { User } from '@unchainedshop/types/user';

type HelperType<T> = (
  enrollment: EnrollmentType,
  _: never,
  context: Context
) => T;

type EnrollmentHelperTypes = {
  plan: HelperType<EnrollmentPlan>;
  user: HelperType<Promise<User>>;
  country: HelperType<Promise<Country>>;
  currency: HelperType<Promise<Currency>>;
};

export const Enrollment: EnrollmentHelperTypes = {
  plan: ({ quantity, productId, configuration }) => {
    return {
      quantity,
      productId,
      configuration,
    };
  },

  user: async (obj, _, { modules }) => {
    return await modules.users.findUser({
      userId: obj.userId,
    });
  },
  
  country: async (obj, _, { modules }) => {
    return await modules.countries.findCountry({ isoCode: obj.countryCode });
  },
  currency: async (obj, _, { modules }) => {
    return await modules.currencies.findCurrency({ isoCode: obj.currencyCode });
  },
};