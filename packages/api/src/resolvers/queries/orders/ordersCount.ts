import { log } from '@unchainedshop/logger';
import { OrderQuery } from '@unchainedshop/core-orders';
import { Context } from '../../../context.js';

export default async function ordersCount(
  root: never,
  params: OrderQuery,
  { modules, userId }: Context,
) {
  const { paymentProviderIds, deliveryProviderIds, ...restParams } = params;
  log(`query ordersCount: ${params.includeCarts ? 'includeCart' : ''}`, { userId });

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
    return 0;
  const paymentIds = orderPayments.map((p) => p._id);
  const deliveryIds = orderDeliveries.map((d) => d._id);

  return modules.orders.count({ ...restParams, paymentIds, deliveryIds });
}
