import { ConfirmService } from '@unchainedshop/types/payments';

export const confirmService: ConfirmService = async (
  { paymentContext, paymentProviderId },
  requestContext,
) => {
  const { modules, userId } = requestContext;

  const normalizedContext = {
    ...paymentContext,
    userId,
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
