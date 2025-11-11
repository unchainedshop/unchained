import { DeliveryDirector } from '@unchainedshop/core';
import { Context } from '../../context.js';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { DeliveryProviderInterface } from './delivery-provider-interface.js';

export const DeliveryProviderPickUp = {
  ...DeliveryProviderInterface,
  async pickUpLocations(provider: DeliveryProvider, _: never, context: Context) {
    const director = await DeliveryDirector.actions(provider, {}, context);
    return director.pickUpLocations() || [];
  },
};
