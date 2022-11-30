import { ConfirmService } from '@unchainedshop/types/payments';

export const confirmService: ConfirmService = async (
  { paymentContext, paymentProviderId },
  requestContext,
) => {
  const { modules } = requestContext;

  const normalizedContext = {
    ...paymentContext,
    paymentProviderId,
  };

  const result = await modules.payment.paymentProviders.confirm(
    paymentProviderId,
    normalizedContext,
    requestContext,
  );

  if (!result) return false;

  return result;
};
