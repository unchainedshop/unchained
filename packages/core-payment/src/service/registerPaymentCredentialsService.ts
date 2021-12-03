import { Context } from '@unchainedshop/types/api';
import {
  PaymentContext,
  PaymentCredentials
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
    const registration = await modules.payment.paymentProviders.register(paymentProviderId, paymentContext)
    if (!registration) return null;

    const paymentCredentialsId =
      await modules.payment.paymentCredentials.upsertCredentials({
        userId,
        paymentProviderId,
        ...registration,
      });

    return await modules.payment.paymentCredentials.findPaymentCredential({
      paymentCredentialsId,
      userId,
      paymentProviderId,
    });
  };