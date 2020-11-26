import { log } from 'meteor/unchained:core-logger';
import { OrderDeliveries } from 'meteor/unchained:core-orders';
import { DeliveryProviderType } from 'meteor/unchained:core-delivery';
import {
  OrderDeliveryNotFoundError,
  InvalidIdError,
  OrderDeliveryTypeError,
} from '../../errors';

const DELIVERY_UPDATE_ENDPOINT = {
  updateOrderDeliveryShipping: DeliveryProviderType.SHIPPING,
  updateOrderDeliveryPickUp: DeliveryProviderType.PICKUP,
};

export default function updateOrderDelivery(
  root,
  { orderDeliveryId, ...context },
  { userId },
  { fieldName }
) {
  log(`mutation updateOrderDelivery ${orderDeliveryId}`, { userId });

  if (!orderDeliveryId) throw new InvalidIdError({ orderDeliveryId });
  const orderDelivery = OrderDeliveries.findOne({ _id: orderDeliveryId });
  if (!orderDelivery) throw new OrderDeliveryNotFoundError({ orderDeliveryId });
  const deliveryProviderType = orderDelivery?.provider()?.type;
  if (deliveryProviderType !== DELIVERY_UPDATE_ENDPOINT[fieldName])
    throw new OrderDeliveryTypeError({
      orderDeliveryId,
      recieved: deliveryProviderType,
      required: DELIVERY_UPDATE_ENDPOINT[fieldName],
    });

  return orderDelivery.updateContext(context);
}
