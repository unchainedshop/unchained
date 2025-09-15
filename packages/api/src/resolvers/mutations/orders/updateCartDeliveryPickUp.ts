import { Context } from '../../../context.js';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';
import {
  InvalidIdError,
  OrderDeliveryTypeError,
  OrderNotFoundError,
  OrderWrongStatusError,
} from '../../../errors.js';

export default async function updateCartDeliveryPickUp(
  root: never,
  params: { orderId: string; deliveryProviderId: string; orderPickUpLocationId: string; meta: any },
  context: Context,
) {
  const { modules, services, userId, user } = context;
  const { orderId, deliveryProviderId, orderPickUpLocationId, meta } = params;
  log(`mutation updateCartDeliveryPickUp provider ${deliveryProviderId}`, {
    userId,
  });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  let order = await services.orders.findOrInitCart({
    orderId,
    user,
    countryCode: context.countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

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

  await modules.orders.deliveries.updateContext(order.deliveryId, {
    orderPickUpLocationId,
    meta,
  });
  return services.orders.updateCalculation(order._id);
}
