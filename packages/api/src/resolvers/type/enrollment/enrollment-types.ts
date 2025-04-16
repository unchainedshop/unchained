import { Context } from '../../../context.js';
import { Country } from '@unchainedshop/core-countries';
import { Currency } from '@unchainedshop/core-currencies';
import { Enrollment as EnrollmentType, EnrollmentPlan } from '@unchainedshop/core-enrollments';
import { User } from '@unchainedshop/core-users';

type HelperType<P, T> = (enrollment: EnrollmentType, params: P, context: Context) => T;

type EnrollmentHelperTypes = {
  isExpired: HelperType<{ referenceDate?: Date }, boolean>;
  plan: HelperType<never, EnrollmentPlan>;
  user: HelperType<never, Promise<User>>;
  country: HelperType<never, Promise<Country>>;
  currency: HelperType<never, Promise<Currency>>;
};

export const Enrollment: EnrollmentHelperTypes = {
  isExpired: (obj, params, { modules }) => {
    return modules.enrollments.isExpired(obj, params);
  },

  plan: ({ quantity, productId, configuration }) => {
    return {
      quantity,
      productId,
      configuration,
    };
  },

  // TODO: use loader
  country: (obj, _, { modules }) => modules.countries.findCountry({ isoCode: obj.countryCode }),

  // TODO: use loader
  currency: (obj, _, { modules }) => modules.currencies.findCurrency({ isoCode: obj.currencyCode }),

  // TODO: use loader
  user: (obj, _, { modules }) => modules.users.findUserById(obj.userId),
};
