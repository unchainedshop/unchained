import { Context } from '@unchainedshop/types/api';
import {
  PaymentContext,
  PaymentCredentials,
} from '@unchainedshop/types/payments';

export type RegisterPaymentCredentialsService = (
  params: {
    paymentContext: PaymentContext;
    paymentProviderId: string;
  },
  context: Context
) => Promise<PaymentCredentials | null>;

export const registerPaymentCredentialsService: RegisterPaymentCredentialsService =
  async ({ paymentContext, paymentProviderId }, { modules, userId }) => {
    const paymentProvider = await modules.payment.paymentProviders.findOne({
      _id: paymentProviderId,
    });
    const registration = paymentProvider.register(
      { transactionContext: paymentContext },
      userId
    );
    if (!registration) return null;
    const paymentCredentialsId =
      modules.payment.paymentCredentials.upsertCredentials({
        userId,
        paymentProviderId,
        ...registration,
      });
    return modules.payment.paymentCredentials.findCredentials(
      paymentCredentialsId
        ? { _id: paymentCredentialsId }
        : { userId, paymentProviderId }
    );
  };
