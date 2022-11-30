import { CancelService } from '@unchainedshop/types/payments';

export const cancelService: CancelService = async (
  { paymentContext, paymentProviderId },
  unchainedAPI,
) => {
  const { modules } = unchainedAPI;

  const normalizedContext = {
    ...paymentContext,
    paymentProviderId,
  };

  const result = await modules.payment.paymentProviders.cancel(
    paymentProviderId,
    normalizedContext,
    unchainedAPI,
  );

  if (!result) return false;

  return result;
};
