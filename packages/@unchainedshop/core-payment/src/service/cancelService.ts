import { CancelService } from '@unchainedshop/types/payments';

export const cancelService: CancelService = async (
  { paymentContext, paymentProviderId },
  requestContext,
) => {
  const { modules, userId } = requestContext;

  const normalizedContext = {
    ...paymentContext,
    userId,
    paymentProviderId,
  };

  const result = await modules.payment.paymentProviders.cancel(
    paymentProviderId,
    normalizedContext,
    requestContext,
  );

  if (!result) return false;

  return result;
};
