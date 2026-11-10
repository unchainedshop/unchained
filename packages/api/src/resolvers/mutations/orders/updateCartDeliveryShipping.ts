import type { Context } from '../../../context.ts';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, OrderDeliveryNotFoundError, OrderDeliveryTypeError } from '../../../errors.ts';
import type { Order } from '@unchainedshop/core-orders';
import { lockCart } from '../../loadCart.ts';

export default async function updateCartDeliveryShipping(
  root: never,
  params: { orderId: string; deliveryProviderId: string; address: any; meta: any },
  context: Context,
) {
  const { modules, services, userId } = context;
  const { orderId, deliveryProviderId, address, meta } = params;
  log(`mutation updateCartDeliveryShipping provider ${deliveryProviderId}`, {
    userId,
  });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  await using cart = await lockCart(context, orderId);
  let order: Order = cart;

  const provider = await modules.delivery.findProvider({
    deliveryProviderId,
  });
  const deliveryProviderType = provider?.type;

  if (deliveryProviderType !== DeliveryProviderType.SHIPPING)
    throw new OrderDeliveryTypeError({
      orderId: order._id,
      received: deliveryProviderType,
      required: DeliveryProviderType.SHIPPING,
    });

  order = (await modules.orders.setDeliveryProvider(order._id, deliveryProviderId)) || order;

  if (!order.deliveryId) throw new OrderDeliveryNotFoundError({ orderId: order._id });

  await modules.orders.deliveries.updateContext(order.deliveryId, {
    address,
    meta,
  });
  return services.orders.updateCalculation(order._id);
}
