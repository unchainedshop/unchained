import {
  DeliveryContext,
  DeliveryDirector,
  DeliveryProvider,
  deliverySettings,
} from '@unchainedshop/core-delivery';
import { Modules } from '../modules.js';

export const supportedDeliveryProvidersService = async (
  params: DeliveryContext,
  unchainedAPI: { modules: Modules },
) => {
  const allProviders = await unchainedAPI.modules.delivery.findProviders({});

  const providers = (
    await Promise.all(
      allProviders.map(async (provider: DeliveryProvider) => {
        const adapter = await DeliveryDirector.actions(provider, params, unchainedAPI);
        return adapter.isActive() ? [provider] : [];
      }),
    )
  ).flat();

  return deliverySettings.filterSupportedProviders(
    {
      providers,
      order: params.order,
    },
    unchainedAPI,
  );
};
