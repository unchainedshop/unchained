import { PaymentProvider, paymentSettings } from '@unchainedshop/core-payment';
import { PaymentDirector } from '../directors/PaymentDirector.js';
import { PaymentContext } from '../directors/PaymentAdapter.js';
import { Modules } from '../modules.js';

export async function supportedPaymentProvidersService(this: Modules, params: PaymentContext) {
  const allProviders = await this.payment.paymentProviders.findProviders({});

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
