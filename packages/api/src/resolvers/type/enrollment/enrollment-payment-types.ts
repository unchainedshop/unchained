import type { Context } from '../../../context.ts';
import type { Enrollment } from '@unchainedshop/core-enrollments';

export const EnrollmentPayment = {
  provider: async (payment: Enrollment['payment'], _: never, { loaders }: Context) => {
    if (!payment?.paymentProviderId) return null;
    return loaders.paymentProviderLoader.load({
      paymentProviderId: payment.paymentProviderId,
    });
  },
};
