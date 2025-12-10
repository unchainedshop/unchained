import {
  type DeliveryProvider as DeliveryProviderActual,
  DeliveryProviderType,
} from '@unchainedshop/core-delivery';
import { DeliveryProviderInterface } from './delivery-provider-interface.ts';

export const DeliveryProvider = {
  __resolveType: async (provider: DeliveryProviderActual) => {
    switch (provider?.type) {
      case DeliveryProviderType.PICKUP:
        return 'DeliveryProviderPickUp';
      default:
        return 'DeliveryProviderShipping';
    }
  },
  ...DeliveryProviderInterface,
};
