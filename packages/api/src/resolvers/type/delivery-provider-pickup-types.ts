import { DeliveryDirector } from '@unchainedshop/core';
import { Context } from '../../context.js';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { DeliveryProviderInterface } from './delivery-provider-interface.js';

export const DeliveryProviderPickUp = {
  ...DeliveryProviderInterface,
  async pickUpLocations(obj: DeliveryProvider, _: never, context: Context) {
    const provider = await context.loaders.deliveryProviderLoader.load({
      deliveryProviderId: obj._id,
    });
    const director = await DeliveryDirector.actions(provider, {}, context);
    return director.pickUpLocations() || [];
  },
};
