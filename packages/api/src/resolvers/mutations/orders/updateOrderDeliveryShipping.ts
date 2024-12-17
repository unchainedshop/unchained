import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { OrderDeliveryNotFoundError, InvalidIdError, OrderDeliveryTypeError } from '../../../errors.js';

export default async function updateOrderDeliveryShipping(
  root: never,
  params: { orderDeliveryId: string; address: any; meta: any },
  context: Context,
) {
  const { modules, services, userId } = context;
  const { orderDeliveryId, address, meta } = params;

  log(`mutation updateOrderDeliveryShipping ${orderDeliveryId}`, { userId });

  if (!orderDeliveryId) throw new InvalidIdError({ orderDeliveryId });

  const orderDelivery = await modules.orders.deliveries.findDelivery({
    orderDeliveryId,
  });
  if (!orderDelivery) throw new OrderDeliveryNotFoundError({ orderDeliveryId });

  const provider = await modules.delivery.findProvider({
    deliveryProviderId: orderDelivery.deliveryProviderId,
  });
  const deliveryProviderType = provider?.type;

  if (deliveryProviderType !== DeliveryProviderType.SHIPPING)
    throw new OrderDeliveryTypeError({
      orderDeliveryId,
      received: deliveryProviderType,
      required: DeliveryProviderType.SHIPPING,
    });

  await modules.orders.deliveries.updateContext(orderDeliveryId, {
    address,
    meta,
  });
  await services.orders.updateCalculation(orderDelivery.orderId);
  return modules.orders.deliveries.findDelivery({
    orderDeliveryId,
  });
}
