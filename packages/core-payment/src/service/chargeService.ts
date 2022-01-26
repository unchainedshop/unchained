import { ChargeService } from '@unchainedshop/types/payments';

export const chargeService: ChargeService = async (
  { paymentContext, paymentProviderId },
  requestContext,
) => {
  const { modules, userId } = requestContext;

  const paymentCredentials =
    paymentContext.transactionContext?.paymentCredentials ||
    (await modules.payment.paymentCredentials.findPaymentCredential({
      userId,
      paymentProviderId,
      isPreferred: true,
    }));

  const normalizedContext = {
    ...paymentContext,
    userId,
    paymentProviderId,
    transactionContext: {
      ...paymentContext.transactionContext,
      paymentCredentials,
    },
  };

  const result = await modules.payment.paymentProviders.charge(
    paymentProviderId,
    normalizedContext,
    requestContext,
  );

  if (!result) return false;

  const { credentials, ...strippedResult } = result;

  if (credentials) {
    await modules.payment.paymentCredentials.upsertCredentials({
      userId,
      paymentProviderId,
      ...credentials,
    });
  }
  return strippedResult;
};
