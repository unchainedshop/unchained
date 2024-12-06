import { PaymentProvider, paymentSettings } from '@unchainedshop/core-payment';
import { PaymentDirector } from '../directors/PaymentDirector.js';
import { PaymentContext } from '../directors/PaymentAdapter.js';
import { Modules } from '../modules.js';

export const supportedPaymentProvidersService = async (
  params: PaymentContext,
  unchainedAPI: { modules: Modules },
) => {
  const allProviders = await unchainedAPI.modules.payment.paymentProviders.findProviders({});

  const providers = (
    await Promise.all(
      allProviders.map(async (provider: PaymentProvider) => {
        const adapter = await PaymentDirector.actions(provider, params, unchainedAPI);
        return adapter.isActive() ? [provider] : [];
      }),
    )
  ).flat();

  return paymentSettings.filterSupportedProviders(
    {
      providers,
      order: params.order,
    },
    unchainedAPI,
  );
};
