import { Order } from '@unchainedshop/core-orders';
import { UnchainedCore, OrderPricingSheet, OrderPricingRowCategory } from '@unchainedshop/core';
import { ch } from '@unchainedshop/utils';

type PriceFormatter = ({ amount, currency }: { amount: number; currency: string }) => string;

export const getOrderSummaryData = async (
  order: Order,
  params: { locale?: string; useNetPrice?: boolean; format?: PriceFormatter },
  context: UnchainedCore,
) => {
  const { modules } = context;
  const { useNetPrice, format = ch.priceToString } = params || {};
  const orderDelivery = await modules.orders.deliveries.findDelivery({
    orderDeliveryId: order.deliveryId,
  });
  const orderPayment = await modules.orders.payments.findOrderPayment({
    orderPaymentId: order.paymentId,
  });
  const paymentProvider = await modules.payment.paymentProviders.findProvider({
    paymentProviderId: orderPayment.paymentProviderId,
  });
  const deliveryProvider = await modules.delivery.findProvider({
    deliveryProviderId: orderDelivery.deliveryProviderId,
  });

  const deliveryAddress = ch.addressToString(
    orderDelivery?.context?.deliveryAddress || order.billingAddress,
  );
  const billingAddress = ch.addressToString(order.billingAddress);
  const orderPricing = OrderPricingSheet({
    calculation: order.calculation,
    currency: order.currency,
  });

  const paymentTotal = orderPricing.total({
    category: OrderPricingRowCategory.Payment,
    useNetPrice,
  });

  const deliveryTotal = orderPricing.total({
    category: OrderPricingRowCategory.Delivery,
    useNetPrice,
  });

  const taxesTotal = orderPricing.total({
    category: OrderPricingRowCategory.Taxes,
    useNetPrice,
  });

  const itemsTotal = orderPricing.total({
    category: OrderPricingRowCategory.Items,
    useNetPrice,
  });

  const total = orderPricing.total({ useNetPrice });

  const payment = paymentProvider.adapterKey;
  const delivery = deliveryProvider.adapterKey;

  return {
    rawPrices: {
      items: itemsTotal,
      taxes: taxesTotal,
      delivery: deliveryTotal,
      payment: paymentTotal,
      gross: total,
    },
    prices: {
      items: format(itemsTotal),
      taxes: format(taxesTotal),
      delivery: format(deliveryTotal),
      payment: format(paymentTotal),
      gross: format(total),
    },
    payment,
    delivery,
    deliveryAddress,
    billingAddress,
  };
};
