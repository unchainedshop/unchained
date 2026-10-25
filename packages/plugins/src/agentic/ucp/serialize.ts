import {
  DeliveryDirector,
  DeliveryPricingSheet,
  OrderPricingRowCategory,
  OrderPricingSheet,
  PaymentPricingSheet,
  ProductPricingRowCategory,
  ProductPricingSheet,
  type UnchainedCore,
} from '@unchainedshop/core';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { OrderDiscountTrigger, type Order, type OrderPosition } from '@unchainedshop/core-orders';
import type { UcpRequest } from './http.ts';
import { executableHandlers, handlerDeclarations } from './payment.ts';
import { CHECKOUT, DISCOUNT, FULFILLMENT, responseCapabilities, UCP_VERSION } from './protocol.ts';
import {
  buyerInput,
  checkoutStatus,
  expiresAt,
  recoverable,
  warning,
  type UcpMessage,
} from './status.ts';
import { checkoutTotals } from './totals.ts';
import { continueUrl, orderUrl } from './handoff.ts';

export type UcpApi = Pick<UnchainedCore, 'modules' | 'services'> & { locale: Intl.Locale };

type Address = NonNullable<Order['billingAddress']>;

const DECLINED =
  'The payment failed, retry with another instrument or continue on the merchant checkout';

export const compact = <T extends Record<string, unknown>>(object: T) =>
  Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Partial<T>;

export const toAddress = (postal: Record<string, string> = {}): Address =>
  compact({
    firstName: postal.first_name,
    lastName: postal.last_name,
    addressLine: postal.street_address,
    addressLine2: postal.extended_address,
    postalCode: postal.postal_code,
    city: postal.address_locality,
    regionCode: postal.address_region,
    countryCode: postal.address_country,
  });

export const toPostalAddress = (address: Address = {}) =>
  compact({
    first_name: address.firstName,
    last_name: address.lastName,
    street_address: address.addressLine,
    extended_address: address.addressLine2,
    postal_code: address.postalCode,
    address_locality: address.city,
    address_region: address.regionCode,
    address_country: address.countryCode,
  });

export async function deliveryOf({ modules }: Pick<UcpApi, 'modules'>, order: Order) {
  const delivery = order.deliveryId
    ? await modules.orders.deliveries.findDelivery({ orderDeliveryId: order.deliveryId })
    : null;
  const provider = delivery
    ? await modules.delivery.findProvider({ deliveryProviderId: delivery.deliveryProviderId })
    : null;
  return { delivery, provider };
}

export async function lineItemOf({ modules, locale }: UcpApi, order: Order, position: OrderPosition) {
  const pricing = ProductPricingSheet({
    calculation: position.calculation,
    currencyCode: order.currencyCode,
    quantity: position.quantity,
  });
  const subtotal = pricing.total({ category: ProductPricingRowCategory.Item }).amount;
  const discount = pricing.total({ category: ProductPricingRowCategory.Discount }).amount;
  const text = await modules.products.texts.findLocalizedText({ productId: position.productId, locale });
  return {
    id: position._id,
    item: {
      id: position.productId,
      title: text?.title || position.productId,
      price: Math.round(subtotal / position.quantity),
    },
    quantity: position.quantity,
    totals: [
      { type: 'subtotal', amount: subtotal },
      ...(discount < 0 ? [{ type: 'items_discount', amount: discount }] : []),
      { type: 'total', amount: pricing.total().amount },
    ],
  };
}

export async function totalsOf(
  { modules }: Pick<UcpApi, 'modules'>,
  order: Order,
  positions: OrderPosition[],
  lineItems: Awaited<ReturnType<typeof lineItemOf>>[],
) {
  const { currencyCode } = order;
  const delivery = order.deliveryId
    ? await modules.orders.deliveries.findDelivery({ orderDeliveryId: order.deliveryId })
    : null;
  const payment = order.paymentId
    ? await modules.orders.payments.findOrderPayment({ orderPaymentId: order.paymentId })
    : null;
  const pricing = OrderPricingSheet({ calculation: order.calculation, currencyCode });
  const sheets = [
    ...positions.map(({ calculation, quantity }) =>
      ProductPricingSheet({ calculation, currencyCode, quantity }),
    ),
    DeliveryPricingSheet({ calculation: delivery?.calculation ?? [], currencyCode }),
    PaymentPricingSheet({ calculation: payment?.calculation ?? [], currencyCode }),
  ];
  const sum = (type: string) =>
    lineItems.reduce(
      (total, { totals }) => total + (totals.find((row) => row.type === type)?.amount ?? 0),
      0,
    );
  return checkoutTotals({
    subtotal: sum('subtotal'),
    itemsDiscount: sum('items_discount'),
    discount: pricing.total({ category: OrderPricingRowCategory.Discounts }).amount,
    fulfillment: pricing.total({ category: OrderPricingRowCategory.Delivery }).amount,
    fee: pricing.total({ category: OrderPricingRowCategory.Payment }).amount,
    total: pricing.total().amount,
    taxSum: pricing.taxSum(),
    rated: sheets
      .flatMap((sheet) => sheet.filterBy({ category: 'TAX' }))
      .flatMap(({ rate, amount }) => (typeof rate === 'number' ? [{ rate, amount }] : [])),
  });
}

function missingFulfillment({ delivery, provider }: Awaited<ReturnType<typeof deliveryOf>>) {
  const path = '$.fulfillment.methods[0]';
  if (!delivery || !provider) {
    return [
      recoverable('missing', `${path}.groups[0].selected_option_id`, 'Select a fulfillment option'),
    ];
  }
  if (provider.type === DeliveryProviderType.PICKUP) {
    return delivery.context?.orderPickUpLocationId
      ? []
      : [recoverable('missing', `${path}.selected_destination_id`, 'Select a pickup location')];
  }
  const address = delivery.context?.address ?? {};
  return ['addressLine', 'postalCode', 'city', 'countryCode'].every((field) => address[field])
    ? []
    : [recoverable('missing', `${path}.selected_destination_id`, 'Provide a complete shipping address')];
}

async function fulfillmentOf(
  { context }: UcpRequest,
  order: Order,
  lineItemIds: string[],
  { delivery, provider }: Awaited<ReturnType<typeof deliveryOf>>,
) {
  const { modules, services } = context;
  const type = provider?.type ?? DeliveryProviderType.SHIPPING;
  const user = await modules.users.findUserById(order.userId);
  const providers = (await services.orders.supportedDeliveryProviders({ order })).filter(
    (candidate) => candidate.type === type,
  );
  const options = await Promise.all(
    providers.map(async (candidate) => {
      const price =
        user &&
        (await services.delivery.simulateDeliveryPricing({
          currencyCode: order.currencyCode,
          countryCode: order.countryCode,
          provider: candidate,
          order,
          user,
        }));
      return {
        id: candidate._id,
        title: DeliveryDirector.getAdapter(candidate.adapterKey)?.label ?? candidate._id,
        totals: [{ type: 'total', amount: price?.amount ?? 0 }],
      };
    }),
  );

  let destinations: Record<string, unknown>[] = [];
  let selectedDestinationId: string | null = null;
  if (provider && type === DeliveryProviderType.PICKUP) {
    const locations = await (await DeliveryDirector.actions(provider, {}, context)).pickUpLocations();
    destinations = locations.map(({ _id, name, address }) => ({
      type: 'business_location',
      id: _id,
      name,
      ...(address ? { address: toPostalAddress(address) } : {}),
    }));
    selectedDestinationId = delivery?.context?.orderPickUpLocationId ?? null;
  } else if (delivery?.context?.address) {
    selectedDestinationId = delivery.context.ucpDestinationId ?? 'default';
    destinations = [
      {
        type: 'shipping_address',
        id: selectedDestinationId,
        ...toPostalAddress(delivery.context.address),
      },
    ];
  }

  return {
    methods: [
      {
        id: 'default',
        type: type === DeliveryProviderType.PICKUP ? 'pickup' : 'shipping',
        line_item_ids: lineItemIds,
        destinations,
        selected_destination_id: selectedDestinationId,
        groups: [
          {
            id: 'default',
            line_item_ids: lineItemIds,
            selected_option_id: provider?._id ?? null,
            options,
          },
        ],
      },
    ],
  };
}

async function discountsOf({ modules, services }: UcpApi, order: Order) {
  const discounts = await modules.orders.discounts.findOrderDiscounts({ orderId: order._id });
  const codes: string[] =
    order.status === null
      ? (order.context?.ucp?.codes ?? [])
      : discounts.flatMap(({ code }) => (code ? [code] : []));
  const applied = await Promise.all(
    discounts.map(async (discount) => ({
      ...(discount.code ? { code: discount.code } : {}),
      title: discount.code ?? discount.discountKey,
      amount: Math.abs((await services.orders.calculateDiscountTotal(order, discount)).amount),
      automatic: discount.trigger === OrderDiscountTrigger.SYSTEM,
    })),
  );
  const warnings = codes.flatMap((code, index) =>
    discounts.some((discount) => discount.code === code)
      ? []
      : [
          warning(
            'discount_code_invalid',
            `$.discounts.codes[${index}]`,
            `The code ${code} cannot be applied`,
          ),
        ],
  );
  return { discounts: { codes, applied }, warnings };
}

export async function serializeCheckout(ucp: UcpRequest, orderId: string, messages: UcpMessage[] = []) {
  const { context, capabilities, options } = ucp;
  const { modules } = context;
  const order = (await modules.orders.findOrder({ orderId }))!;
  const placed = order.status !== null;
  const positions = await modules.orders.positions.findOrderPositions({ orderId });
  const lineItems = await Promise.all(positions.map((position) => lineItemOf(context, order, position)));
  const products = await Promise.all(
    positions.map(({ productId }) => modules.products.findProduct({ productId })),
  );
  const delivery = await deliveryOf(context, order);
  const executable = placed ? [] : await executableHandlers(ucp, order);
  const missing: UcpMessage[] = [];
  const escalations: UcpMessage[] = [];
  if (!placed) {
    if (!positions.length) {
      missing.push(recoverable('missing', '$.line_items', 'Add at least one line item'));
    }
    positions.forEach(({ productId }, index) => {
      if (products[index] && modules.products.isActive(products[index])) return;
      missing.push(
        recoverable('item_unavailable', `$.line_items[${index}]`, `${productId} is not available`),
      );
    });
    if (!order.contact?.emailAddress) {
      missing.push(recoverable('missing', '$.buyer.email', 'Provide the buyer email'));
    }
    const fulfillmentGaps = missingFulfillment(delivery);
    if (capabilities.has(FULFILLMENT)) missing.push(...fulfillmentGaps);
    else if (fulfillmentGaps.length) {
      escalations.push(
        buyerInput('fulfillment_required', 'The buyer chooses the delivery on the merchant checkout'),
      );
    }
    if (!executable.length) {
      escalations.push(buyerInput('payment_required', 'The buyer pays on the merchant checkout'));
    }
  }
  const status = checkoutStatus({
    placed,
    canceled: Boolean(order.context?.ucp?.canceled),
    expired: expiresAt(order) < new Date(),
    attempt: Boolean(order.context?.ucp?.attempt),
    escalations,
    missing,
  });
  const open = status !== 'completed' && status !== 'canceled';
  const discounts = capabilities.has(DISCOUNT) ? await discountsOf(context, order) : null;
  const declined = order.context?.ucp?.declined
    ? [recoverable('payment_failed', '$.payment.instruments[0]', DECLINED)]
    : [];
  const allMessages = open
    ? [...messages, ...missing, ...declined, ...escalations, ...(discounts?.warnings ?? [])]
    : messages;
  const buyer = compact({
    email: order.contact?.emailAddress,
    phone_number: order.contact?.telNumber,
    first_name: order.billingAddress?.firstName,
    last_name: order.billingAddress?.lastName,
  });

  return {
    ucp: {
      version: UCP_VERSION,
      status: 'success',
      capabilities: responseCapabilities(capabilities, CHECKOUT),
      payment_handlers: handlerDeclarations(executable),
    },
    id: order._id,
    status,
    currency: order.currencyCode,
    line_items: lineItems,
    ...(Object.keys(buyer).length ? { buyer } : {}),
    totals: await totalsOf(context, order, positions, lineItems),
    links: options.links ?? [],
    expires_at: expiresAt(order).toISOString(),
    ...(capabilities.has(FULFILLMENT)
      ? {
          fulfillment: await fulfillmentOf(
            ucp,
            order,
            lineItems.map(({ id }) => id),
            delivery,
          ),
        }
      : {}),
    ...(discounts ? { discounts: discounts.discounts } : {}),
    ...(allMessages.length ? { messages: allMessages } : {}),
    ...(open ? { continue_url: continueUrl(options, order) } : {}),
    ...(placed
      ? {
          order: {
            id: order._id,
            ...(order.orderNumber ? { label: order.orderNumber } : {}),
            permalink_url: orderUrl(options, order),
          },
        }
      : {}),
  };
}
