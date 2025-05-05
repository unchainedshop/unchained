import { Context } from '../../../context.js';
import { Enrollment as EnrollmentType } from '@unchainedshop/core-enrollments';

export const Enrollment = {
  isExpired: (obj: EnrollmentType, params: { referenceDate?: Date }, { modules }: Context) => {
    return modules.enrollments.isExpired(obj, params);
  },

  plan: ({ quantity, productId, configuration }: EnrollmentType) => {
    return {
      quantity,
      productId,
      configuration,
    };
  },

  country: async (obj: EnrollmentType, _: never, { loaders }: Context) =>
    loaders.currencyLoader.load({ isoCode: obj.countryCode }),
  currency: async (obj: EnrollmentType, _: never, { loaders }: Context) =>
    loaders.currencyLoader.load({ isoCode: obj.currencyCode }),
  user: async (obj: EnrollmentType, _: never, { loaders }: Context) =>
    loaders.userLoader.load({ userId: obj.userId }),
};
