import { OrderPricingRowCategory, OrderPricingSheet } from '@unchainedshop/core';
import { OrderStatus, type Order } from '@unchainedshop/core-orders';
import type { Context } from '../context.ts';

const statusForOrder = async (order: Order, context: Context) => {
  if (order.context?.acp?.canceled) return 'canceled';
  if (order.status === OrderStatus.PENDING) return 'complete_in_progress';
  if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.FULFILLED) {
    return 'completed';
  }
  if (order.status === OrderStatus.REJECTED) return 'requires_escalation';

  const positions = await context.modules.orders.positions.findOrderPositions({
    orderId: order._id,
  });
  return order.contact &&
    order.billingAddress &&
    order.deliveryId &&
    order.paymentId &&
    positions.length > 0
    ? 'ready_for_payment'
    : 'not_ready_for_payment';
};

const priceTotal = (
  order: Order,
  category?: (typeof OrderPricingRowCategory)[keyof typeof OrderPricingRowCategory],
) =>
  OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
  }).total({ category, useNetPrice: false }).amount;

export const serializeCheckoutSession = async (order: Order, context: Context) => {
  const positions = await context.modules.orders.positions.findOrderPositions({
    orderId: order._id,
  });
  const status = await statusForOrder(order, context);
  const total = priceTotal(order);
  const items = priceTotal(order, OrderPricingRowCategory.Items);
  const discount = priceTotal(order, OrderPricingRowCategory.Discounts);
  const fulfillment = priceTotal(order, OrderPricingRowCategory.Delivery);
  const fee = priceTotal(order, OrderPricingRowCategory.Payment);
  const tax = OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
  }).taxSum();

  const fulfillmentOptions = await context.services.orders.supportedDeliveryProviders({
    order,
  });
  const selectedDelivery = order.deliveryId
    ? await context.modules.orders.deliveries.findDelivery({
        orderDeliveryId: order.deliveryId,
      })
    : null;

  return {
    id: order._id,
    status,
    currency: order.currencyCode.toLowerCase(),
    buyer: order.contact?.emailAddress
      ? {
          email: order.contact.emailAddress,
          phone_number: order.contact.telNumber,
        }
      : undefined,
    line_items: positions.map((position) => ({
      id: position._id,
      item: { id: position.originalProductId || position.productId },
      product_id: position.originalProductId || position.productId,
      variant_id: position.productId,
      quantity: position.quantity,
      totals: [],
    })),
    totals: [
      { type: 'items_base_amount', display_text: 'Items', amount: items },
      ...(discount ? [{ type: 'discount', display_text: 'Discount', amount: discount }] : []),
      ...(fulfillment
        ? [{ type: 'fulfillment', display_text: 'Fulfillment', amount: fulfillment }]
        : []),
      ...(tax ? [{ type: 'tax', display_text: 'Tax', amount: Math.round(tax) }] : []),
      ...(fee ? [{ type: 'fee', display_text: 'Payment fee', amount: fee }] : []),
      { type: 'total', display_text: 'Total', amount: total },
    ],
    fulfillment_options: fulfillmentOptions.map((provider) => ({
      type: 'shipping',
      id: provider._id,
      title: provider._id,
      totals: [],
    })),
    selected_fulfillment_options: selectedDelivery
      ? [
          {
            type: 'shipping',
            option_id: selectedDelivery.deliveryProviderId,
            item_ids: positions.map(({ _id }) => _id),
          },
        ]
      : undefined,
    messages: [],
    links: [],
    capabilities: {
      payment: {
        handlers: [
          {
            id: 'stripe_spt',
            name: 'dev.acp.tokenized.card',
            display_name: 'Card',
            version: '2026-01-22',
            spec: 'https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/rfcs/rfc.payment_handlers.md',
            requires_delegate_payment: true,
            requires_pci_compliance: false,
            psp: 'stripe',
            config_schema:
              'https://raw.githubusercontent.com/agentic-commerce-protocol/agentic-commerce-protocol/main/spec/2026-04-17/json-schema/schema.agentic_checkout.json#/$defs/PaymentHandler',
            instrument_schemas: [
              'https://raw.githubusercontent.com/agentic-commerce-protocol/agentic-commerce-protocol/main/spec/2026-04-17/json-schema/schema.agentic_checkout.json#/$defs/PaymentData',
            ],
            config: {},
          },
        ],
      },
      interventions: {},
      extensions: [],
    },
    continue_url: context.getHeader('origin') || undefined,
    created_at: order.created?.toISOString(),
    updated_at: order.updated?.toISOString(),
  };
};
