import { Context } from '../../../context.js';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, OrderDeliveryNotFoundError, OrderDeliveryTypeError } from '../../../errors.js';

export default async function updateOrderDeliveryPickUp(
  root: never,
  params: { orderDeliveryId: string; orderPickUpLocationId: string; meta: any },
  context: Context,
) {
  const { modules, userId } = context;
  const { orderDeliveryId, orderPickUpLocationId, meta } = params;
  log(`mutation updateOrderDeliveryPickUp ${orderDeliveryId} with location ${orderPickUpLocationId}`, {
    userId,
  });

  if (!orderDeliveryId) throw new InvalidIdError({ orderDeliveryId });

  const orderDelivery = await modules.orders.deliveries.findDelivery({
    orderDeliveryId,
  });
  if (!orderDelivery) throw new OrderDeliveryNotFoundError({ orderDeliveryId });

  const provider = await modules.delivery.findProvider({
    deliveryProviderId: orderDelivery.deliveryProviderId,
  });
  const deliveryProviderType = provider?.type;

  if (deliveryProviderType !== DeliveryProviderType.PICKUP)
    throw new OrderDeliveryTypeError({
      orderDeliveryId,
      received: deliveryProviderType,
      required: DeliveryProviderType.PICKUP,
    });

  await modules.orders.deliveries.updateContext(orderDeliveryId, {
    orderPickUpLocationId,
    meta,
  });
  await modules.orders.updateCalculation(orderDelivery.orderId, context);
  return modules.orders.deliveries.findDelivery({
    orderDeliveryId,
  });
}
