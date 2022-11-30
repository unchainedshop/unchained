import { RegisterPaymentCredentialsService } from '@unchainedshop/types/payments';

export const registerPaymentCredentialsService: RegisterPaymentCredentialsService = async (
  paymentProviderId,
  paymentContext,
  unchainedAPI,
) => {
  const { modules } = unchainedAPI;
  const registration = await modules.payment.paymentProviders.register(
    paymentProviderId,
    paymentContext,
    unchainedAPI,
  );

  if (!registration) return null;

  const paymentCredentialsId = await modules.payment.paymentCredentials.upsertCredentials({
    userId: paymentContext.userId,
    paymentProviderId,
    ...registration,
  });

  return modules.payment.paymentCredentials.findPaymentCredential({
    paymentCredentialsId,
    userId: paymentContext.userId,
    paymentProviderId,
  });
};
