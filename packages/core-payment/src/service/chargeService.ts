import { Context } from '@unchainedshop/types/api';
import { PaymentContext } from '@unchainedshop/types/payments';

export type ChargeService = (
  params: {
    paymentContext: PaymentContext;
    paymentProviderId: string;
  },
  context: Context
) => Promise<any>;

export const chargeService: ChargeService = async (
  { paymentContext, paymentProviderId },
  { modules, userId }
) => {
  const normalizedContext = {
    ...paymentContext,
    userId,
    paymentProviderId,
    transactionContext: {
      ...paymentContext.transactionContext,
      paymentCredentials:
        paymentContext.transactionContext?.paymentCredentials ??
        modules.payment.paymentCredentials.findPaymentCredential({
          userId,
          paymentProviderId,
          isPreferred: true,
        }),
    },
  };

  const result = await modules.payment.paymentProviders.charge(
    paymentProviderId,
    normalizedContext,
  );

  if (!result) return false;
  const { credentials, ...strippedResult } = result;
  if (credentials) {
    modules.payment.paymentCredentials.upsertCredentials({
      userId,
      paymentProviderId,
      ...credentials,
    });
  }
  return strippedResult;
};
