import { Context } from '../../../context.js';
import { PaymentProvider } from '@unchainedshop/core-payment';
import { Enrollment } from '@unchainedshop/core-enrollments';

type HelperType<T> = (enrollmentPayment: Enrollment['payment'], _: never, context: Context) => T;

type EnrollmentPaymentHelperTypes = {
  provider: HelperType<Promise<PaymentProvider>>;
};

export const EnrollmentPayment: EnrollmentPaymentHelperTypes = {
  provider: async ({ paymentProviderId }, _, { modules }) => {
    // TODO: use loader
    return modules.payment.paymentProviders.findProvider({
      paymentProviderId,
    });
  },
};
