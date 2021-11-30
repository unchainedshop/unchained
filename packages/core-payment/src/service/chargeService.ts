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
    ...context,
    transactionContext: {
      ...paymentContext.transactionContext,
      paymentCredentials:
        paymentContext.transactionContext?.paymentCredentials ??
        modules.payment.paymentCredentials.findCredential({
          userId,
          paymentProviderId,
          isPreferred: true,
        }),
    },
  };

  const result = await modules.payment.paymentProvider.charge(
    normalizedContext,
    userId
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
