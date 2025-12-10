import type { PaymentContext } from '../directors/PaymentAdapter.ts';
import { PaymentDirector } from '../directors/PaymentDirector.ts';
import type { Modules } from '../modules.ts';

export async function registerPaymentCredentialsService(
  this: Modules,
  paymentProviderId: string,
  paymentContext: PaymentContext,
) {
  const paymentProvider = await this.payment.paymentProviders.findProvider({
    paymentProviderId,
  });

  if (!paymentProvider) return null;

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
