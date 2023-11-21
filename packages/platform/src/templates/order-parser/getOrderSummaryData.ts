import { UnchainedCore } from '@unchainedshop/types/core.js';
import { Order } from '@unchainedshop/types/orders.js';
import { OrderPricingRowCategory } from '@unchainedshop/types/orders.pricing.js';
import { Locale } from '@unchainedshop/types/common.js';
import formatPrice from './formatPrice.js';
import { formatAddress } from './formatAddress.js';

type PriceFormatter = ({ amount, currency }: { amount: number; currency: string }) => string;

export const getOrderSummaryData = async (
  order: Order,
  params: { locale?: Locale; useNetPrice?: boolean; format?: PriceFormatter },
  context: UnchainedCore,
) => {
  const { modules } = context;
  const { useNetPrice, format = formatPrice } = params || {};
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
