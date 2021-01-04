import { log } from 'meteor/unchained:core-logger';
import { OrderDeliveries } from 'meteor/unchained:core-orders';
import { DeliveryProviderType } from 'meteor/unchained:core-delivery';
import {
  OrderDeliveryNotFoundError,
  InvalidIdError,
  OrderDeliveryTypeError,
} from '../../errors';

export default function updateOrderDeliveryPickUp(
  root,
  { orderDeliveryId, ...context },
  { userId }
) {
  log(`mutation updateOrderDeliveryPickUp ${orderDeliveryId}`, { userId });

  if (!orderDeliveryId) throw new InvalidIdError({ orderDeliveryId });
  const orderDelivery = OrderDeliveries.findDelivery({ orderDeliveryId });
  if (!orderDelivery) throw new OrderDeliveryNotFoundError({ orderDeliveryId });
  const deliveryProviderType = orderDelivery?.provider()?.type;
  if (deliveryProviderType !== DeliveryProviderType.PICKUP)
    throw new OrderDeliveryTypeError({
      orderDeliveryId,
      received: deliveryProviderType,
      required: DeliveryProviderType.PICKUP,
    });

  return orderDelivery.updateContext(context);
}
