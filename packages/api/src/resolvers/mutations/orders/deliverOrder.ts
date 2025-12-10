import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { OrderDeliveryStatus } from '@unchainedshop/core-orders';
import {
  OrderNotFoundError,
  OrderWrongDeliveryStatusError,
  OrderWrongStatusError,
  InvalidIdError,
  OrderDeliveryNotFoundError,
} from '../../../errors.ts';

export default async function deliverOrder(
  root: never,
  { orderId }: { orderId: string },
  context: Context,
) {
  const { modules, services, userId } = context;
  log('mutation deliverOrder', { orderId, userId });

  if (!orderId) throw new InvalidIdError({ orderId });

  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new OrderNotFoundError({ orderId });

  if (modules.orders.isCart(order)) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  const orderDelivery =
    order.deliveryId &&
    (await modules.orders.deliveries.findDelivery({
      orderDeliveryId: order.deliveryId,
    }));

  if (!orderDelivery) throw new OrderDeliveryNotFoundError({ orderDeliveryId: order.deliveryId });

  if (
    modules.orders.deliveries.normalizedStatus(orderDelivery) !== OrderDeliveryStatus.OPEN &&
    order.confirmed
  ) {
    throw new OrderWrongDeliveryStatusError({
      status: orderDelivery.status,
    });
  }

  await modules.orders.deliveries.markAsDelivered(orderDelivery);
  return services.orders.processOrder(order, {});
}
