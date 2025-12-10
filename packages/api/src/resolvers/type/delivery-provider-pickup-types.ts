import { DeliveryDirector } from '@unchainedshop/core';
import type { Context } from '../../context.ts';
import type { DeliveryProvider } from '@unchainedshop/core-delivery';
import { DeliveryProviderInterface } from './delivery-provider-interface.ts';

export const DeliveryProviderPickUp = {
  ...DeliveryProviderInterface,
  async pickUpLocations(provider: DeliveryProvider, _: never, context: Context) {
    const director = await DeliveryDirector.actions(provider, {}, context);
    return director.pickUpLocations() || [];
  },
};
