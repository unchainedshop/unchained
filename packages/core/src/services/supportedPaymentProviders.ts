import { type PaymentProvider, paymentSettings } from '@unchainedshop/core-payment';
import { PaymentDirector } from '../directors/PaymentDirector.ts';
import type { PaymentContext } from '../directors/PaymentAdapter.ts';
import type { Modules } from '../modules.ts';

export async function supportedPaymentProvidersService(this: Modules, params: PaymentContext) {
  const allProviders = await this.payment.paymentProviders.allProviders();

  const providers = (
    await Promise.all(
      allProviders.map(async (provider: PaymentProvider) => {
        const adapter = await PaymentDirector.actions(provider, params, { modules: this });
        return adapter.isActive() ? [provider] : [];
      }),
    )
  ).flat();

  return paymentSettings.filterSupportedProviders(
    {
      providers,
      order: params.order,
    },
    { modules: this },
  );
}
