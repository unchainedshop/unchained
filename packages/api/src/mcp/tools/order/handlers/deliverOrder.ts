import { OrderDeliveryStatus } from '@unchainedshop/core-orders';
import { Context } from '../../../../context.js';
import {
  OrderNotFoundError,
  OrderWrongDeliveryStatusError,
  OrderWrongStatusError,
  OrderDeliveryNotFoundError,
} from '../../../../errors.js';
import { getNormalizedOrderDetails } from '../../../utils/getNormalizedOrderDetails.js';
import { Params } from '../schemas.js';

export default async function deliverOrder(context: Context, params: Params<'DELIVER_ORDER'>) {
  const { modules, services } = context;
  const { orderId } = params;
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
  await services.orders.processOrder(order, {});
  return { order: await getNormalizedOrderDetails({ orderId }, context) };
}
