import type { Order } from '@unchainedshop/core-orders';
import { type UnchainedCore, OrderPricingSheet, OrderPricingRowCategory } from '@unchainedshop/core';
import { ch } from '@unchainedshop/utils';

type PriceFormatter = ({ amount, currencyCode }: { amount: number; currencyCode: string }) => string;

export const getOrderSummaryData = async (
  order: Order,
  params: { locale: Intl.Locale; useNetPrice?: boolean; format?: PriceFormatter },
  context: UnchainedCore,
) => {
  const { modules } = context;
  const { useNetPrice, format = ch.priceToString } = params || {};
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

  const deliveryAddress = ch.addressToString(
    orderDelivery?.context?.deliveryAddress || order.billingAddress,
  );
  const billingAddress = ch.addressToString(order.billingAddress);
  const orderPricing = OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
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

  const payment = paymentProvider?.adapterKey;
  const delivery = deliveryProvider?.adapterKey;

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
