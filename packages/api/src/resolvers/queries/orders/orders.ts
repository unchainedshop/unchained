import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/utils';
import { OrderQuery } from '@unchainedshop/core-orders';
import { Context } from '../../../context.js';

export default async function orders(
  root: never,
  params: OrderQuery & { limit?: number; offset?: number; sort?: SortOption[] },
  { modules, userId }: Context,
) {
  const { limit, offset, paymentProviderIds, deliveryProviderIds, ...restParams } = params;
  log(`query orders: ${limit} ${offset}  ${restParams?.queryString || ''}`, { userId });

  const promises: Promise<any>[] = [];

  await Promise.all(promises);
  const [orderPayments, orderDeliveries] = await Promise.all([
    paymentProviderIds?.length
      ? modules.orders.payments.findOrderPaymentsByProviderIds({ paymentProviderIds })
      : [],
    deliveryProviderIds?.length
      ? modules.orders.deliveries.findDeliveryByProvidersId({ deliveryProviderIds })
      : [],
  ]);
  if (
    (paymentProviderIds?.length && !orderPayments.length) ||
    (deliveryProviderIds?.length && !orderDeliveries.length)
  )
    return [];
  const paymentIds = orderPayments.map((p) => p._id);
  const deliveryIds = orderDeliveries.map((d) => d._id);

  return modules.orders.findOrders({
    ...restParams,
    paymentIds,
    deliveryIds,
  });
}
