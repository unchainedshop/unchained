import { OrderDelivery as OrderDeliveryType } from '@unchainedshop/core-orders';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { objectInvert } from '@unchainedshop/utils';
import { Context } from '../../../context.js';

const OrderDeliveryMap = {
  OrderDeliveryShipping: DeliveryProviderType.SHIPPING,
  OrderDeliveryPickUp: DeliveryProviderType.PICKUP,
};

export const OrderDelivery = {
  __resolveType: async (obj: OrderDeliveryType, { loaders }: Context) => {
    const provider = await loaders.deliveryProviderLoader.load({
      deliveryProviderId: obj.deliveryProviderId,
    });

    const invertedProductTypes = objectInvert(OrderDeliveryMap);
    if (provider) {
      return invertedProductTypes[provider.type];
    }
    return invertedProductTypes[DeliveryProviderType.SHIPPING];
  },
};
