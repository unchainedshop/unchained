import { ChargeService } from '@unchainedshop/types/payments';

export const chargeService: ChargeService = async (
  { paymentContext, paymentProviderId },
  requestContext
) => {
  const { modules, userId } = requestContext;
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
    requestContext
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
