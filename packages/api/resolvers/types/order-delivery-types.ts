import { OrderDelivery } from '@unchainedshop/types/orders';
import { DeliveryProviderType } from 'meteor/unchained:core-delivery';
import { objectInvert } from 'meteor/unchained:utils';
import { Context } from '@unchainedshop/types/api';

const OrderDeliveryMap = {
  OrderDeliveryShipping: DeliveryProviderType.SHIPPING,
  OrderDeliveryPickUp: DeliveryProviderType.PICKUP,
};

export default {
  __resolveType: async (obj: OrderDelivery, _: never, { modules }: Context) => {
    const provider = await modules.delivery.findProvider({
      deliveryProviderId: obj.deliveryProviderId,
    });

    const invertedProductTypes = objectInvert(OrderDeliveryMap);
    if (provider) {
      return invertedProductTypes[provider.type];
    }
    return invertedProductTypes[DeliveryProviderType.SHIPPING];
  },
};
