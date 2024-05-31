import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { OrderDeliveryNotFoundError, InvalidIdError, OrderDeliveryTypeError } from '../../../errors.js';

export default async function updateOrderDeliveryShipping(
  root: Root,
  params: { orderDeliveryId: string; address: any; meta: any },
  context: Context,
) {
  const { modules, userId } = context;
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

  return modules.orders.deliveries.updateContext(orderDeliveryId, { address, meta }, context);
}
