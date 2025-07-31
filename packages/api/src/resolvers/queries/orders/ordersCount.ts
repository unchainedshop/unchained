import { log } from '@unchainedshop/logger';
import { OrderQuery } from '@unchainedshop/core-orders';
import { Context } from '../../../context.js';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';

export default async function ordersCount(
  root: never,
  params: OrderQuery,
  { modules, userId }: Context,
) {
  const { paymentProviderTypes, deliveryProviderTypes, ...restParams } = params;
  log(`query ordersCount: ${params.includeCarts ? 'includeCart' : ''}`, { userId });

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
  const paymentIds = orderPayments.map((p) => p._id);
  const deliveryIds = orderDeliveries.map((d) => d._id);

  return modules.orders.count({ ...restParams, paymentIds, deliveryIds });
}
