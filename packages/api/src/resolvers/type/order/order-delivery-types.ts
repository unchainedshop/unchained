import type { OrderDelivery as OrderDeliveryType } from '@unchainedshop/core-orders';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import type { Context } from '../../../context.ts';

export const OrderDelivery = {
  __resolveType: async (obj: OrderDeliveryType, { loaders }: Context) => {
    const provider = await loaders.deliveryProviderLoader.load({
      deliveryProviderId: obj.deliveryProviderId,
    });

    switch (provider?.type) {
      case DeliveryProviderType.PICKUP:
        return 'DeliveryProviderPickUp';
      default:
        return 'DeliveryProviderShipping';
    }
  },
};
