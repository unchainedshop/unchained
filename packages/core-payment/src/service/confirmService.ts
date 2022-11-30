import { ConfirmService } from '@unchainedshop/types/payments';

export const confirmService: ConfirmService = async (
  { paymentContext, paymentProviderId },
  unchainedAPI,
) => {
  const { modules } = unchainedAPI;

  const normalizedContext = {
    ...paymentContext,
    paymentProviderId,
  };

  const result = await modules.payment.paymentProviders.confirm(
    paymentProviderId,
    normalizedContext,
    unchainedAPI,
  );

  if (!result) return false;

  return result;
};
