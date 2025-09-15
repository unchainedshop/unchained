import { Context } from '../../../context.js';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';
import {
  InvalidIdError,
  OrderDeliveryTypeError,
  OrderNotFoundError,
  OrderWrongStatusError,
} from '../../../errors.js';

export default async function updateCartDeliveryShipping(
  root: never,
  params: { orderId: string; deliveryProviderId: string; address: any; meta: any },
  context: Context,
) {
  const { modules, services, userId, user } = context;
  const { orderId, deliveryProviderId, address, meta } = params;
  log(`mutation updateCartDeliveryShipping provider ${deliveryProviderId}`, {
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

  if (deliveryProviderType !== DeliveryProviderType.SHIPPING)
    throw new OrderDeliveryTypeError({
      orderId: order._id,
      received: deliveryProviderType,
      required: DeliveryProviderType.SHIPPING,
    });

  order = (await modules.orders.setDeliveryProvider(order._id, deliveryProviderId)) || order;

  await modules.orders.deliveries.updateContext(order.deliveryId, {
    address,
    meta,
  });
  return services.orders.updateCalculation(order._id);
}
