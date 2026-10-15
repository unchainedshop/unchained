import { OrderPricingRowCategory, OrderPricingSheet, type UnchainedCore } from '@unchainedshop/core';
import { OrderDeliveryStatus, OrderStatus, type Order } from '@unchainedshop/core-orders';
import { systemLocale } from '@unchainedshop/utils';
import { acpConfig } from './config.ts';

export const acpContextOf = (order: Order) =>
  (order.context as { acp?: Record<string, unknown> } | undefined)?.acp;

export const isACPCanceled = (order: Order) => Boolean(acpContextOf(order)?.canceled);

export const isACPAuthenticationRequired = (order: Order) =>
  Boolean(acpContextOf(order)?.authenticationRequired);

export const acpOrderStatus = (order: Order) => {
  if (isACPCanceled(order) || order.status === OrderStatus.REJECTED) return 'canceled';
  if (order.status === OrderStatus.FULFILLED) return 'completed';
  if (order.status === OrderStatus.CONFIRMED) return 'confirmed';
  return 'created';
};

export const acpTotals = (order: Order) => {
  const pricing = OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
  });
  const netTotal = (category: (typeof OrderPricingRowCategory)[keyof typeof OrderPricingRowCategory]) =>
    pricing.total({ category, useNetPrice: true }).amount;
  const items = netTotal(OrderPricingRowCategory.Items);
  const discount = -netTotal(OrderPricingRowCategory.Discounts);
  const fulfillment = netTotal(OrderPricingRowCategory.Delivery);
  const fee = netTotal(OrderPricingRowCategory.Payment);
  const total = pricing.total({ useNetPrice: false }).amount;
  const tax = total - items + discount - fulfillment - fee;
  return [
    { type: 'items_base_amount', display_text: 'Items', amount: items },
    ...(discount ? [{ type: 'discount', display_text: 'Discount', amount: discount }] : []),
    ...(fulfillment ? [{ type: 'fulfillment', display_text: 'Fulfillment', amount: fulfillment }] : []),
    ...(tax ? [{ type: 'tax', display_text: 'Tax', amount: tax }] : []),
    ...(fee ? [{ type: 'fee', display_text: 'Payment fee', amount: fee }] : []),
    { type: 'total', display_text: 'Total', amount: total },
  ];
};

export const serializeACPOrder = async (order: Order, { modules }: Pick<UnchainedCore, 'modules'>) => {
  const [positions, delivery] = await Promise.all([
    modules.orders.positions.findOrderPositions({ orderId: order._id }),
    order.deliveryId
      ? modules.orders.deliveries.findDelivery({ orderDeliveryId: order.deliveryId })
      : null,
  ]);
  const delivered = delivery?.status === OrderDeliveryStatus.DELIVERED;
  const locale = new Intl.Locale((acpContextOf(order)?.locale as string) || systemLocale.baseName);
  const lineItems = await Promise.all(
    positions.map(async ({ _id, productId, originalProductId, quantity }) => {
      const text = await modules.products.texts.findLocalizedText({ productId, locale });
      return {
        id: _id,
        title: text?.title || productId,
        product_id: originalProductId || productId,
        quantity: { ordered: quantity, current: quantity, fulfilled: delivered ? quantity : 0 },
      };
    }),
  );

  return {
    type: 'order',
    id: order._id,
    checkout_session_id: order._id,
    order_number: order.orderNumber,
    permalink_url: `${acpConfig.continueUrl}/${order.orderNumber || order._id}`,
    status: acpOrderStatus(order),
    line_items: lineItems,
    ...(delivery
      ? {
          fulfillments: [
            {
              id: delivery._id,
              type: delivery.context?.orderPickUpLocationId ? 'pickup' : 'shipping',
              status: delivered ? 'delivered' : 'pending',
            },
          ],
        }
      : {}),
    totals: acpTotals(order),
  };
};
