import { CancelService } from '@unchainedshop/types/payments';

export const cancelService: CancelService = async (
  { paymentContext, paymentProviderId },
  requestContext,
) => {
  const { modules } = requestContext;

  const normalizedContext = {
    ...paymentContext,
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
