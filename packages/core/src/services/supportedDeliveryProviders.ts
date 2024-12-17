import { DeliveryProvider, deliverySettings } from '@unchainedshop/core-delivery';
import { Modules } from '../modules.js';
import { DeliveryContext, DeliveryDirector } from '../directors/index.js';

export async function supportedDeliveryProvidersService(this: Modules, params: DeliveryContext) {
  const allProviders = await this.delivery.findProviders({});

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
