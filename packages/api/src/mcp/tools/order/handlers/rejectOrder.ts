import { OrderStatus } from '@unchainedshop/core-orders';
import { Context } from '../../../../context.js';
import { OrderNotFoundError, OrderWrongStatusError } from '../../../../errors.js';
import { getNormalizedOrderDetails } from '../../../utils/getNormalizedOrderDetails.js';
import { Params } from '../schemas.js';

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
