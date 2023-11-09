import { UnchainedCore } from '@unchainedshop/types/core.js';
import { Order } from '@unchainedshop/types/orders.js';
import { OrderPricingRowCategory } from '@unchainedshop/types/orders.pricing.js';
import { Locale } from '@unchainedshop/types/common.js';
import { DeliveryInterface } from '@unchainedshop/types/delivery.js';
import formatPrice from './formatPrice.js';
import { formatAddress } from './formatAddress.js';

export const getOrderSummaryData = async (
  order: Order,
  params: { locale?: Locale },
  context: UnchainedCore,
) => {
  const { modules } = context;
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

  const deliveryAddress = formatAddress(orderDelivery?.context?.deliveryAddress || order.billingAddress);
  const billingAddress = formatAddress(order.billingAddress);
  const orderPricing = modules.orders.pricingSheet(order);

  const paymentTotal = orderPricing.total({
    category: OrderPricingRowCategory.Payment,
    useNetPrice: false,
  });

  const deliveryTotal = orderPricing.total({
    category: OrderPricingRowCategory.Delivery,
    useNetPrice: false,
  });

  const taxesTotal = orderPricing.total({
    category: OrderPricingRowCategory.Taxes,
    useNetPrice: false,
  });

  const itemsTotal = orderPricing.total({
    category: OrderPricingRowCategory.Items,
    useNetPrice: false,
  });

  const total = orderPricing.total({ useNetPrice: false });

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
      items: formatPrice(itemsTotal),
      taxes: formatPrice(taxesTotal),
      delivery: formatPrice(deliveryTotal),
      payment: formatPrice(paymentTotal),
      gross: formatPrice(total),
    },
    payment,
    delivery,
    deliveryAddress,
    billingAddress,
  };
};
