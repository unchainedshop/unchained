import { OrderPricingSheet } from '@unchainedshop/core';
import { Context } from '../../context.js';
import { getNormalizedProductDetails } from './getNormalizedProductDetails.js';
import { removeConfidentialServiceHashes } from '@unchainedshop/core-users';

export async function getNormalizedOrderDetails(
  { orderId, orderNumber }: { orderId?: string; orderNumber?: string },
  context: Context,
) {
  const { modules, loaders } = context;
  const order = await modules.orders.findOrder({ orderId, orderNumber });
  if (!order) return null;
  const positions = await modules.orders.positions.findOrderPositions({
    orderId: order._id,
  });
  const payment = await modules.orders.payments.findOrderPayment({
    orderPaymentId: order?.paymentId,
  });
  const delivery = await modules.orders.deliveries.findDelivery({
    orderDeliveryId: order?.deliveryId,
  });
  const [
    items,
    user,
    enrollments,
    currency,
    country,
    supportedPaymentProviders,
    supportedDeliveryProviders,
    discounts,
  ] = await Promise.all([
    Promise.all(
      positions.map(async ({ productId, ...position }) => ({
        ...(await getNormalizedProductDetails(productId, context)),
        ...position,
      })),
    ),
    loaders.userLoader.load({ userId: order.userId }),
    modules.enrollments.findEnrollment({
      orderId: order._id,
    }),
    loaders.currencyLoader.load({ isoCode: order.currencyCode }),
    loaders.countryLoader.load({ isoCode: order.countryCode }),
    context.services.orders.supportedPaymentProviders({
      order,
    }),
    context.services.orders.supportedDeliveryProviders({
      order,
    }),
    modules.orders.discounts.findOrderDiscounts({ orderId: order._id }),
  ]);
  let total = null;
  const pricing = OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
  });

  if (pricing.isValid()) {
    total = pricing.total();
  }

  return {
    ...order,
    total,
    discounts,
    enrollments,
    currency,
    supportedDeliveryProviders,
    supportedPaymentProviders,
    country,
    user: removeConfidentialServiceHashes(user),
    status: order?.status ?? 'OPEN',
    items,
    payment,
    delivery,
  };
}
