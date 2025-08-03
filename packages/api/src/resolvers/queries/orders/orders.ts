import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/utils';
import { OrderQuery } from '@unchainedshop/core-orders';
import { Context } from '../../../context.js';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';

export default async function orders(
  root: never,
  params: OrderQuery & { limit?: number; offset?: number; sort?: SortOption[] },
  { modules, userId }: Context,
) {
  const { limit, offset, paymentProviderTypes, deliveryProviderTypes, ...restParams } = params;
  log(`query orders: ${limit} ${offset}  ${restParams?.queryString || ''}`, { userId });

  const promises: Promise<any>[] = [];

  let paymentProviderIds: string[] | undefined;
  let deliveryProviderIds: string[] | undefined;

  if (paymentProviderTypes?.length) {
    promises.push(
      modules.payment.paymentProviders
        .findProviders({ type: { $in: paymentProviderTypes as PaymentProviderType[] } })
        .then((providers) => (paymentProviderIds = providers.map((p) => p._id))),
    );
  }

  if (deliveryProviderTypes?.length) {
    promises.push(
      modules.delivery
        .findProviders({ type: { $in: deliveryProviderTypes as DeliveryProviderType[] } })
        .then((providers) => (deliveryProviderIds = providers.map((p) => p._id))),
    );
  }

  await Promise.all(promises);
  const [orderPayments, orderDeliveries] = await Promise.all([
    paymentProviderIds
      ? modules.orders.payments.findOrderPaymentsByProviderIds({ paymentProviderIds })
      : [],
    deliveryProviderIds
      ? modules.orders.deliveries.findDeliveryByProvidersId({ deliveryProviderIds })
      : [],
  ]);
  if (
    (paymentProviderTypes?.length && !orderPayments.length) ||
    (deliveryProviderTypes?.length && !orderDeliveries.length)
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
