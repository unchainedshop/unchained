import { Context } from '../../../context.js';
import { Enrollment } from '@unchainedshop/core-enrollments';

export const EnrollmentPayment = {
  provider: async ({ paymentProviderId }: Enrollment['payment'], _: never, { loaders }: Context) => {
    return loaders.paymentProviderLoader.load({
      paymentProviderId,
    });
  },
};
