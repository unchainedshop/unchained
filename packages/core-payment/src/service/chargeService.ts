import { ChargeService } from '@unchainedshop/types/payments';

export const chargeService: ChargeService = async (
  { paymentContext, paymentProviderId },
  unchainedAPI,
) => {
  const { modules } = unchainedAPI;

  const paymentCredentials =
    paymentContext.transactionContext?.paymentCredentials ||
    (await modules.payment.paymentCredentials.findPaymentCredential({
      userId: paymentContext.userId,
      paymentProviderId,
      isPreferred: true,
    }));

  const normalizedContext = {
    ...paymentContext,
    paymentProviderId,
    transactionContext: {
      ...paymentContext.transactionContext,
      paymentCredentials,
    },
  };

  const result = await modules.payment.paymentProviders.charge(
    paymentProviderId,
    normalizedContext,
    unchainedAPI,
  );

  if (!result) return false;

  const { credentials, ...strippedResult } = result;

  if (credentials) {
    const { token, ...meta } = credentials;
    await modules.payment.paymentCredentials.upsertCredentials({
      userId: paymentContext.userId,
      paymentProviderId,
      token,
      ...meta,
    });
  }
  return strippedResult;
};
