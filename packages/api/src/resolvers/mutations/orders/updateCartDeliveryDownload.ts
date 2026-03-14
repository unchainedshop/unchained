import type { Context } from '../../../context.ts';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';
import {
  InvalidIdError,
  OrderDeliveryNotFoundError,
  OrderDeliveryTypeError,
  OrderNotFoundError,
  OrderWrongStatusError,
} from '../../../errors.ts';

export default async function updateCartDeliveryDownload(
  root: never,
  params: { orderId: string; deliveryProviderId: string; meta: any },
  context: Context,
) {
  const { modules, services, userId, user } = context;
  const { orderId, deliveryProviderId, meta } = params;
  log(`mutation updateCartDeliveryDownload provider ${deliveryProviderId}`, {
    userId,
  });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  let order = await services.orders.findOrInitCart({
    orderId,
    user: user!,
    countryCode: context.countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  const provider = await modules.delivery.findProvider({
    deliveryProviderId,
  });
  const deliveryProviderType = provider?.type;

  if (deliveryProviderType !== DeliveryProviderType.DOWNLOAD)
    throw new OrderDeliveryTypeError({
      orderId: order._id,
      received: deliveryProviderType,
      required: DeliveryProviderType.DOWNLOAD,
    });

  order = (await modules.orders.setDeliveryProvider(order._id, deliveryProviderId)) || order;

  if (!order.deliveryId) throw new OrderDeliveryNotFoundError({ orderId: order._id });

  await modules.orders.deliveries.updateContext(order.deliveryId, {
    meta,
  });
  return services.orders.updateCalculation(order._id);
}
