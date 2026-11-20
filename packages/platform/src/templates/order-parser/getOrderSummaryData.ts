import type { Order } from '@unchainedshop/core-orders';
import {
  type MessageTemplateContext,
  OrderPricingSheet,
  OrderPricingRowCategory,
} from '@unchainedshop/core';
import { ch } from '@unchainedshop/utils';
import { getOrderPriceFormatter, type OrderDisplayOptions } from './getOrderPriceFormatter.ts';

export const getOrderSummaryData = async (
  order: Order,
  params: OrderDisplayOptions,
  context: MessageTemplateContext,
) => {
  const { modules } = context;
  const format = await getOrderPriceFormatter(order.currencyCode, params, context);
  const orderDelivery =
    order.deliveryId &&
    (await modules.orders.deliveries.findDelivery({
      orderDeliveryId: order.deliveryId,
    }));

  if (!orderDelivery) throw new Error('Order delivery not found');

  const orderPayment =
    order.paymentId &&
    (await modules.orders.payments.findOrderPayment({
      orderPaymentId: order.paymentId,
    }));

  if (!orderPayment) throw new Error('Order payment not found');

  const paymentProvider = await modules.payment.paymentProviders.findProvider({
    paymentProviderId: orderPayment.paymentProviderId,
  });
  const deliveryProvider = await modules.delivery.findProvider({
    deliveryProviderId: orderDelivery.deliveryProviderId,
  });

  // Shipping deliveries store their address as context.address (updateCartDeliveryShipping)
  const deliveryAddress = ch.addressToString(
    orderDelivery?.context?.address || orderDelivery?.context?.deliveryAddress || order.billingAddress,
  );
  const billingAddress = ch.addressToString(order.billingAddress);
  const sheet = OrderPricingSheet(order);
  const total = (category?: OrderPricingRowCategory) =>
    sheet.total({ category, useNetPrice: params?.useNetPrice });
  const rawPrices = {
    items: total(OrderPricingRowCategory.Items),
    taxes: total(OrderPricingRowCategory.Taxes),
    delivery: total(OrderPricingRowCategory.Delivery),
    payment: total(OrderPricingRowCategory.Payment),
    gross: total(),
  };

  return {
    rawPrices,
    prices: {
      items: format(rawPrices.items),
      taxes: format(rawPrices.taxes),
      delivery: format(rawPrices.delivery),
      payment: format(rawPrices.payment),
      gross: format(rawPrices.gross),
    },
    payment: paymentProvider?.adapterKey,
    delivery: deliveryProvider?.adapterKey,
    deliveryAddress,
    billingAddress,
  };
};
