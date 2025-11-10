import { Context } from '../../context.js';
import {
  DeliveryProvider as DeliveryProviderActual,
  DeliveryProviderType,
} from '@unchainedshop/core-delivery';
import { objectInvert } from '@unchainedshop/utils';
import { DeliveryProviderInterface } from './delivery-provider-interface.js';

const DeliveryProviderMap = {
  DeliveryProviderShipping: DeliveryProviderType.SHIPPING,
  DeliveryProviderPickUp: DeliveryProviderType.PICKUP,
};

export const DeliveryProvider = {
  __resolveType: async (obj: DeliveryProviderActual, { loaders }: Context) => {
    const provider = await loaders.deliveryProviderLoader.load({
      deliveryProviderId: obj._id,
    });

    const invertedProductTypes = objectInvert(DeliveryProviderMap);
    if (provider) {
      return invertedProductTypes[provider.type];
    }
    return invertedProductTypes[DeliveryProviderType.SHIPPING];
  },
  ...DeliveryProviderInterface,
};
