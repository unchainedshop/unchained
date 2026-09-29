import { type DeliveryProvider, deliverySettings } from '@unchainedshop/core-delivery';
import { createLogger } from '@unchainedshop/logger';
import type { Modules } from '../modules.ts';
import { type DeliveryContext, DeliveryDirector } from '../directors/index.ts';

const logger = createLogger('unchained:core');

export async function supportedDeliveryProvidersService(this: Modules, params: DeliveryContext) {
  const allProviders = await this.delivery.allProviders();

  const providers = (
    await Promise.all(
      allProviders.map(async (provider: DeliveryProvider) => {
        // A provider whose plugin is not registered (removed, renamed or not deployed yet)
        // must not break every cart, so it counts as inactive
        if (!DeliveryDirector.getAdapter(provider.adapterKey)) {
          logger.warn('Delivery provider skipped, its adapter is not registered', {
            deliveryProviderId: provider._id,
            adapterKey: provider.adapterKey,
          });
          return [];
        }
        const adapter = await DeliveryDirector.actions(provider, params, { modules: this });
        return adapter.isActive() ? [provider] : [];
      }),
    )
  ).flat();

  return deliverySettings.filterSupportedProviders(
    {
      providers,
      order: params.order,
    },
    { modules: this },
  );
}
