import { PaymentCredentials } from '@unchainedshop/core-payment';
import { PaymentContext } from '../directors/PaymentAdapter.js';
import { PaymentDirector } from '../directors/PaymentDirector.js';
import { Modules } from '../modules.js';

export const registerPaymentCredentialsService = async (
  paymentProviderId: string,
  paymentContext: PaymentContext,
  unchainedAPI: { modules: Modules },
): Promise<PaymentCredentials> => {
  const { modules } = unchainedAPI;

  const paymentProvider = await modules.payment.paymentProviders.findProvider({
    paymentProviderId,
  });
  const actions = await PaymentDirector.actions(paymentProvider, paymentContext, unchainedAPI);
  const registration = await actions.register();

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
