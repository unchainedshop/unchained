import { CancelService } from '@unchainedshop/types/payments';

export const cancelService: CancelService = async (
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

  const result = await modules.payment.paymentProviders.cancel(
    paymentProviderId,
    normalizedContext,
    requestContext,
  );

  if (!result) return false;

  return result;
};
