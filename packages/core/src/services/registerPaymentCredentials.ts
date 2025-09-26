import { PaymentCredentials } from '@unchainedshop/core-payment';
import { PaymentContext } from '../directors/PaymentAdapter.js';
import { PaymentDirector } from '../directors/PaymentDirector.js';
import { Modules } from '../modules.js';

export async function registerPaymentCredentialsService(
  this: Modules,
  paymentProviderId: string,
  paymentContext: PaymentContext,
): Promise<PaymentCredentials> {
  const paymentProvider = await this.payment.paymentProviders.findProvider({
    paymentProviderId,
  });
  const actions = await PaymentDirector.actions(paymentProvider, paymentContext, { modules: this });
  const registration = await actions.register();

  if (!registration) return null;

  const paymentCredentials = await this.payment.paymentCredentials.upsertCredentials({
    userId: paymentContext.userId,
    paymentProviderId,
    ...registration,
  });

  return paymentCredentials;
}
