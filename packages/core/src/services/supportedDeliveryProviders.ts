import { type DeliveryProvider, deliverySettings } from '@unchainedshop/core-delivery';
import type { Modules } from '../modules.ts';
import { type DeliveryContext, DeliveryDirector } from '../directors/index.ts';

export async function supportedDeliveryProvidersService(this: Modules, params: DeliveryContext) {
  const allProviders = await this.delivery.allProviders();

  const providers = (
    await Promise.all(
      allProviders.map(async (provider: DeliveryProvider) => {
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
