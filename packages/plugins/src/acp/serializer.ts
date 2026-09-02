import { DeliveryDirector, OrderPricingRowCategory, OrderPricingSheet } from '@unchainedshop/core';
import { DeliveryProviderType, type DeliveryLocation } from '@unchainedshop/core-delivery';
import { OrderStatus, type Order, type OrderPosition } from '@unchainedshop/core-orders';
import { ACP_API_VERSION, acpConfig, type ACPContext } from './config.ts';

const checkoutStatus = (order: Order, positions: OrderPosition[]) => {
  if ((order.context as any)?.acp?.canceled) return 'canceled';
  if (order.status === OrderStatus.PENDING) return 'complete_in_progress';
  if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.FULFILLED) {
    return 'completed';
  }
  if (order.status === OrderStatus.REJECTED) return 'requires_escalation';
  return order.contact?.emailAddress &&
    order.billingAddress &&
    order.deliveryId &&
    order.paymentId &&
    positions.length > 0
    ? 'ready_for_payment'
    : 'not_ready_for_payment';
};

const toACPAddress = (address: any) =>
  address
    ? {
        name: [address.firstName, address.lastName].filter(Boolean).join(' ') || address.company || '',
        line_one: address.addressLine || '',
        ...(address.addressLine2 ? { line_two: address.addressLine2 } : {}),
        city: address.city || '',
        state: address.regionCode || '',
        country: address.countryCode || '',
        postal_code: address.postalCode || '',
        ...(address.company ? { company: address.company } : {}),
      }
    : undefined;

const pickupLocation = (location: DeliveryLocation) => ({
  name: location.name,
  address: {
    name: location.name,
    line_one: location.address.addressLine,
    ...(location.address.addressLine2 ? { line_two: location.address.addressLine2 } : {}),
    city: location.address.city,
    state: '',
    country: location.address.countryCode,
    postal_code: location.address.postalCode,
  },
});

export interface ACPFulfillmentOption {
  id: string;
  providerId: string;
  type: 'shipping' | 'pickup';
  deliveryContext?: Record<string, unknown>;
  response: Record<string, unknown>;
}

export const getACPFulfillmentOptions = async (
  order: Order,
  context: ACPContext,
): Promise<ACPFulfillmentOption[]> => {
  const providers = await context.services.orders.supportedDeliveryProviders({ order });
  const options = await Promise.all(
    providers.map(async (provider): Promise<ACPFulfillmentOption[]> => {
      if (provider.type === DeliveryProviderType.SHIPPING) {
        return [
          {
            id: provider._id,
            providerId: provider._id,
            type: 'shipping',
            response: {
              type: 'shipping',
              id: provider._id,
              title: provider._id,
              totals: [],
            },
          },
        ];
      }
      if (provider.type !== DeliveryProviderType.PICKUP) return [];

      try {
        const adapter = await DeliveryDirector.actions(
          provider,
          { order },
          { modules: context.modules },
        );
        const locations = await adapter.pickUpLocations();
        return locations.map((location) => {
          const id = `${provider._id}:${location._id}`;
          return {
            id,
            providerId: provider._id,
            type: 'pickup' as const,
            deliveryContext: { orderPickUpLocationId: location._id },
            response: {
              type: 'pickup',
              id,
              title: location.name,
              location: pickupLocation(location),
              pickup_type: 'in_store',
              totals: [],
            },
          };
        });
      } catch {
        return [];
      }
    }),
  );
  return options.flat();
};

export const serializeCheckoutSession = async (order: Order, context: ACPContext) => {
  const positions = await context.modules.orders.positions.findOrderPositions({
    orderId: order._id,
  });
  const pricing = OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
  });
  const priceTotal = (
    category?: (typeof OrderPricingRowCategory)[keyof typeof OrderPricingRowCategory],
  ) => pricing.total({ category, useNetPrice: false }).amount;
  const fulfillmentOptions = await getACPFulfillmentOptions(order, context);
  const selectedDelivery = order.deliveryId
    ? await context.modules.orders.deliveries.findDelivery({ orderDeliveryId: order.deliveryId })
    : null;
  const selectedOption = selectedDelivery
    ? fulfillmentOptions.find(
        (option) =>
          option.providerId === selectedDelivery.deliveryProviderId &&
          (option.type !== 'pickup' ||
            option.deliveryContext?.orderPickUpLocationId ===
              selectedDelivery.context?.orderPickUpLocationId),
      )
    : undefined;
  const discount = priceTotal(OrderPricingRowCategory.Discounts);
  const fulfillment = priceTotal(OrderPricingRowCategory.Delivery);
  const fee = priceTotal(OrderPricingRowCategory.Payment);
  const tax = pricing.taxSum();

  return {
    id: order._id,
    protocol: { version: ACP_API_VERSION },
    status: checkoutStatus(order, positions),
    currency: order.currencyCode.toLowerCase(),
    buyer: order.contact?.emailAddress
      ? {
          email: order.contact.emailAddress,
          ...(order.contact.telNumber ? { phone_number: order.contact.telNumber } : {}),
        }
      : undefined,
    fulfillment_details:
      order.billingAddress || order.contact
        ? {
            ...(order.contact?.emailAddress ? { email: order.contact.emailAddress } : {}),
            ...(order.contact?.telNumber ? { phone_number: order.contact.telNumber } : {}),
            ...(order.billingAddress ? { address: toACPAddress(order.billingAddress) } : {}),
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
      {
        type: 'items_base_amount',
        display_text: 'Items',
        amount: priceTotal(OrderPricingRowCategory.Items),
      },
      ...(discount ? [{ type: 'discount', display_text: 'Discount', amount: discount }] : []),
      ...(fulfillment
        ? [{ type: 'fulfillment', display_text: 'Fulfillment', amount: fulfillment }]
        : []),
      ...(tax ? [{ type: 'tax', display_text: 'Tax', amount: Math.round(tax) }] : []),
      ...(fee ? [{ type: 'fee', display_text: 'Payment fee', amount: fee }] : []),
      { type: 'total', display_text: 'Total', amount: priceTotal() },
    ],
    fulfillment_options: fulfillmentOptions.map(({ response }) => response),
    selected_fulfillment_options: selectedOption
      ? [
          {
            type: selectedOption.type,
            option_id: selectedOption.id,
            item_ids: positions.map(({ _id }) => _id),
          },
        ]
      : undefined,
    messages: [],
    links: [
      ...(acpConfig.sellerPrivacyPolicy
        ? [
            {
              type: 'privacy_policy',
              title: 'Privacy policy',
              url: acpConfig.sellerPrivacyPolicy,
            },
          ]
        : []),
      ...(acpConfig.sellerTerms
        ? [
            {
              type: 'terms_of_use',
              title: 'Terms of service',
              url: acpConfig.sellerTerms,
            },
          ]
        : []),
    ],
    capabilities: {
      payment: { handlers: [acpConfig.paymentHandler] },
      interventions: {},
      extensions: [],
    },
    continue_url: acpConfig.continueUrl,
    created_at: order.created?.toISOString(),
    updated_at: order.updated?.toISOString(),
  };
};
