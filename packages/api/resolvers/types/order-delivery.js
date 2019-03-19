import { DeliveryProviderType } from 'meteor/unchained:core-delivery';
import { objectInvert } from 'meteor/unchained:utils';

const OrderDeliveryMap = {
  OrderDeliveryShipping: DeliveryProviderType.SHIPPING,
  OrderDeliveryPickUp: DeliveryProviderType.PICKUP
};

export default {
  __resolveType(obj) {
    const provider = obj.provider();
    const invertedProductTypes = objectInvert(OrderDeliveryMap);
    if (provider) {
      return invertedProductTypes[provider.type];
    }
    return invertedProductTypes[DeliveryProviderType.SHIPPING];
  }
};
