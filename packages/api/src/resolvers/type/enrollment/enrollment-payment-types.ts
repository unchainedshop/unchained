import { Context } from '@unchainedshop/api';
import { PaymentProvider } from '@unchainedshop/types/payments.js';
import { Enrollment } from '@unchainedshop/core-enrollments';

type HelperType<T> = (enrollmentPayment: Enrollment['payment'], _: never, context: Context) => T;

type EnrollmentPaymentHelperTypes = {
  provider: HelperType<Promise<PaymentProvider>>;
};

export const EnrollmentPayment: EnrollmentPaymentHelperTypes = {
  provider: async ({ paymentProviderId }, _, { modules }) => {
    return modules.payment.paymentProviders.findProvider({
      paymentProviderId,
    });
  },
};
