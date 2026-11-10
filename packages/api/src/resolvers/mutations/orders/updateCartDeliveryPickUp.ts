import type { Context } from '../../../context.ts';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, OrderDeliveryNotFoundError, OrderDeliveryTypeError } from '../../../errors.ts';
import type { Order } from '@unchainedshop/core-orders';
import { lockCart } from '../../loadCart.ts';

export default async function updateCartDeliveryPickUp(
  root: never,
  params: { orderId: string; deliveryProviderId: string; orderPickUpLocationId: string; meta: any },
  context: Context,
) {
  const { modules, services, userId } = context;
  const { orderId, deliveryProviderId, orderPickUpLocationId, meta } = params;
  log(`mutation updateCartDeliveryPickUp provider ${deliveryProviderId}`, {
    userId,
  });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  await using cart = await lockCart(context, orderId);
  let order: Order = cart;

  const provider = await modules.delivery.findProvider({
    deliveryProviderId,
  });
  const deliveryProviderType = provider?.type;

  if (deliveryProviderType !== DeliveryProviderType.PICKUP)
    throw new OrderDeliveryTypeError({
      orderId: order._id,
      received: deliveryProviderType,
      required: DeliveryProviderType.PICKUP,
    });

  order = (await modules.orders.setDeliveryProvider(order._id, deliveryProviderId)) || order;

  if (!order.deliveryId) throw new OrderDeliveryNotFoundError({ orderId: order._id });

  await modules.orders.deliveries.updateContext(order.deliveryId, {
    orderPickUpLocationId,
    meta,
  });
  return services.orders.updateCalculation(order._id);
}
