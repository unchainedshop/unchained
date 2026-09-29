import { type PaymentProvider, paymentSettings } from '@unchainedshop/core-payment';
import { createLogger } from '@unchainedshop/logger';
import { PaymentDirector } from '../directors/PaymentDirector.ts';
import type { PaymentContext } from '../directors/PaymentAdapter.ts';
import type { Modules } from '../modules.ts';

const logger = createLogger('unchained:core');

export async function supportedPaymentProvidersService(this: Modules, params: PaymentContext) {
  const allProviders = await this.payment.paymentProviders.allProviders();

  const providers = (
    await Promise.all(
      allProviders.map(async (provider: PaymentProvider) => {
        // A provider whose plugin is not registered (removed, renamed or not deployed yet)
        // must not break every cart, so it counts as inactive
        if (!PaymentDirector.getAdapter(provider.adapterKey)) {
          logger.warn('Payment provider skipped, its adapter is not registered', {
            paymentProviderId: provider._id,
            adapterKey: provider.adapterKey,
          });
          return [];
        }
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
