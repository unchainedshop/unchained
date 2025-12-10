import { OrderStatus } from '@unchainedshop/core-orders';
import type { Context } from '../../../../context.ts';
import { OrderNotFoundError, OrderWrongStatusError } from '../../../../errors.ts';
import { getNormalizedOrderDetails } from '../../../utils/getNormalizedOrderDetails.ts';
import type { Params } from '../schemas.ts';

export default async function rejectOrder(context: Context, params: Params<'REJECT_ORDER'>) {
  const { modules, services } = context;
  const { orderId, ...transactionContext } = params;

  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new OrderNotFoundError({ orderId });

  if (order.status !== OrderStatus.PENDING) {
    throw new OrderWrongStatusError({ status: order.status });
  }
  await services.orders.rejectOrder(order, transactionContext);
  return { order: await getNormalizedOrderDetails({ orderId }, context) };
}
