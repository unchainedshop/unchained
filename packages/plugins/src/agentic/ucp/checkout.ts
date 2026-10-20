import { DeliveryDirector, OrderPricingSheet } from '@unchainedshop/core';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { OrderDiscountTrigger, type Order } from '@unchainedshop/core-orders';
import { ProductType } from '@unchainedshop/core-products';
import { createLogger } from '@unchainedshop/logger';
import type { UcpRequest, UcpResult } from './http.ts';
import { executableHandlers } from './payment.ts';
import { DISCOUNT, FULFILLMENT, ORDER, UCP_VERSION, ucpError } from './protocol.ts';
import { compact, deliveryOf, serializeCheckout, toAddress } from './serialize.ts';
import { isClosed, recoverable, unrecoverable, warning, type UcpMessage } from './status.ts';

const logger = createLogger('unchained:ucp');

const VALIDATION_ERRORS = [
  'ContactMissingError',
  'BillingAddressMissingError',
  'NoDeliveryProviderError',
  'NoPaymentProviderError',
  'NoItemsError',
  'QuotationInvalidError',
];

const notFound = (): UcpResult => ({
  status: 200,
  body: {
    ucp: { version: UCP_VERSION, status: 'error' },
    messages: [unrecoverable('not_found', 'Checkout session not found')],
  },
});

const respond = async (ucp: UcpRequest, orderId: string, messages?: UcpMessage[], status = 200) => ({
  status,
  body: await serializeCheckout(ucp, orderId, messages),
});

function assertLineItems(lines: unknown) {
  const valid =
    Array.isArray(lines) &&
    lines.every(
      (line) =>
        typeof line?.item?.id === 'string' && Number.isInteger(line.quantity) && line.quantity >= 1,
    );
  if (!valid) {
    throw ucpError(
      'invalid_request',
      'line_items must list items with an id and a quantity of at least 1',
    );
  }
}

async function findCheckout({ context, profileUrl }: UcpRequest) {
  const order = await context.modules.orders.findOrder({ orderId: context.params.id });
  return order?.context?.ucp?.platform === profileUrl ? order : null;
}

const heartbeat = ({ context }: UcpRequest, userId: string) =>
  context.modules.users.updateHeartbeat(userId, {
    remoteAddress: context.remoteAddress,
    remotePort: context.remotePort,
    userAgent: context.getHeader('user-agent'),
    locale: context.locale?.baseName,
    countryCode: context.countryCode,
  });

async function replaceLines(
  { context }: UcpRequest,
  order: Order,
  lines: any[],
  messages: UcpMessage[],
) {
  const { modules, services } = context;
  const positions = await modules.orders.positions.findOrderPositions({ orderId: order._id });
  const kept = new Map<string, { index: number; quantity: number }>();
  const added: { index: number; productId: string; quantity: number }[] = [];
  const unavailable = (index: number) =>
    messages.push(
      recoverable(
        'item_unavailable',
        `$.line_items[${index}]`,
        `${lines[index].item.id} is not available`,
      ),
    );

  for (const [index, { id, item, quantity }] of lines.entries()) {
    if (positions.some(({ _id }) => _id === id)) {
      kept.set(id, { index, quantity });
      continue;
    }
    const product =
      (await modules.products.findProduct({ productId: item.id })) ||
      (await modules.products.findProduct({ sku: item.id }));
    if (
      product &&
      modules.products.isActive(product) &&
      product.type !== ProductType.CONFIGURABLE_PRODUCT
    ) {
      added.push({ index, productId: product._id, quantity });
    } else {
      unavailable(index);
    }
  }

  for (const position of positions) {
    const line = kept.get(position._id);
    if (!line) {
      await modules.orders.positions.delete(position._id);
    } else if (line.quantity !== position.quantity) {
      try {
        await services.orders.updateCartItem(
          { order, item: position, quantity: line.quantity },
          context,
        );
      } catch {
        unavailable(line.index);
      }
    }
  }
  for (const { index, productId, quantity } of added) {
    try {
      await services.orders.addMultipleCartProducts(
        { order, items: [{ productId, quantity }] },
        context,
      );
    } catch {
      unavailable(index);
    }
  }
}

async function resolveFulfillment(
  { context }: UcpRequest,
  order: Order,
  fulfillment: any,
  names: Record<string, string>,
) {
  const method = fulfillment?.methods?.[0];
  if (!method) return {};
  const path = '$.fulfillment.methods[0]';
  const current = await deliveryOf(context, order);
  const type =
    { shipping: DeliveryProviderType.SHIPPING, pickup: DeliveryProviderType.PICKUP }[method.type] ??
    (method.type ? null : current.provider?.type);
  const optionId = method.groups?.[0]?.selected_option_id;
  const providers = (await context.services.orders.supportedDeliveryProviders({ order })).filter(
    (provider) => provider.type === type,
  );
  const provider = optionId
    ? providers.find(({ _id }) => _id === optionId)
    : (providers.find(({ _id }) => _id === current.provider?._id) ?? providers[0]);
  if (!provider) {
    return {
      error: recoverable(
        'fulfillment_unavailable',
        optionId ? `${path}.groups[0].selected_option_id` : `${path}.type`,
        'This fulfillment option is not available',
      ),
    };
  }

  if (provider.type === DeliveryProviderType.PICKUP) {
    const locationId = method.selected_destination_id;
    if (!locationId) return { provider };
    const actions = await DeliveryDirector.actions(provider, {}, context);
    if (!(await actions.pickUpLocationById(locationId))) {
      return {
        error: recoverable(
          'invalid',
          `${path}.selected_destination_id`,
          'This pickup location is not available',
        ),
      };
    }
    return { provider, deliveryContext: { orderPickUpLocationId: locationId } };
  }
  const destination = method.destinations?.[0];
  if (!destination) return { provider };
  return {
    provider,
    deliveryContext: {
      address: { ...names, ...toAddress(destination) },
      ucpDestinationId: destination.id ?? 'default',
    },
  };
}

async function replaceCodes({ context }: UcpRequest, order: Order, codes: string[]) {
  const { modules, services } = context;
  for (const orderDiscount of await modules.orders.discounts.findOrderDiscounts({
    orderId: order._id,
  })) {
    if (orderDiscount.trigger === OrderDiscountTrigger.USER && !codes.includes(orderDiscount.code!)) {
      await services.orders.removeCartDiscount({
        order,
        orderDiscount,
        requestContext: { localeContext: context.locale, userId: order.userId },
      });
    }
  }
  for (const code of codes) {
    if (await modules.orders.discounts.isDiscountCodeUsed({ code, orderId: order._id })) continue;
    try {
      await services.orders.createManualOrderDiscount({ order, code });
    } catch (error) {
      logger.warn(`Discount code ${code} refused: ${error.message}`, { orderId: order._id });
    }
  }
}

async function applyCheckout(ucp: UcpRequest, orderId: string, body: Record<string, any>) {
  const { context, capabilities } = ucp;
  const { modules, services } = context;
  await using lock = await modules.orders.acquireLock(orderId, 'checkout');
  const order = (await modules.orders.findOrder({ orderId }))!;
  const buyer = body.buyer ?? {
    email: order.contact?.emailAddress,
    phone_number: order.contact?.telNumber,
    first_name: order.billingAddress?.firstName,
    last_name: order.billingAddress?.lastName,
  };
  const names = compact({ firstName: buyer.first_name, lastName: buyer.last_name });

  const fulfillment = capabilities.has(FULFILLMENT)
    ? await resolveFulfillment(ucp, order, body.fulfillment, names)
    : {};
  if (fulfillment.error) return [fulfillment.error];

  const messages: UcpMessage[] = [];
  await replaceLines(ucp, order, body.line_items, messages);
  if (fulfillment.provider) {
    await services.orders.selectDeliveryProvider({
      order,
      deliveryProviderId: fulfillment.provider._id,
      expectedType: fulfillment.provider.type,
      deliveryContext: fulfillment.deliveryContext,
    });
  }

  const { provider, delivery } = await deliveryOf(
    context,
    (await modules.orders.findOrder({ orderId }))!,
  );
  const shippingAddress =
    provider?.type === DeliveryProviderType.SHIPPING ? delivery?.context?.address : undefined;
  const instrumentAddress = body.payment?.instruments?.[0]?.billing_address;
  await modules.orders.updateCartFields(orderId, {
    contact: compact({ emailAddress: buyer.email, telNumber: buyer.phone_number }),
    billingAddress: instrumentAddress
      ? { ...names, ...toAddress(instrumentAddress) }
      : (shippingAddress ?? { ...order.billingAddress, ...names }),
  });

  const codes =
    capabilities.has(DISCOUNT) && Array.isArray(body.discounts?.codes)
      ? body.discounts.codes.map(String)
      : null;
  if (codes) await replaceCodes(ucp, order, codes);
  await modules.orders.updateContext(orderId, {
    ucp: { ...order.context.ucp, codes: codes ?? order.context.ucp.codes, declined: false },
  });

  const selected = (await modules.orders.findOrder({ orderId }))!;
  const calculated = await services.orders.updateCalculation(orderId);
  if (calculated.deliveryId !== selected.deliveryId) {
    messages.push(
      warning(
        'fulfillment_changed',
        '$.fulfillment.methods[0].groups[0].selected_option_id',
        'The fulfillment option changed because the previous one no longer applies',
      ),
    );
  }
  return messages;
}

export async function createCheckout(ucp: UcpRequest): Promise<UcpResult> {
  const { context, body, profileUrl, profile, platform, capabilities } = ucp;
  const { modules, services } = context;
  assertLineItems(body.line_items);
  const userId = await modules.users.createUser(
    {
      email: `guest-${crypto.randomUUID()}@unchained.local`,
      guest: true,
      password: null,
      initialPassword: true,
    },
    { skipMessaging: true },
  );
  await heartbeat(ucp, userId);
  const webhookUrl =
    platform && capabilities.has(ORDER) && profile.ucp.capabilities?.[ORDER]?.[0]?.config?.webhook_url;
  const order = await modules.orders.create({
    userId,
    currencyCode: context.currencyCode,
    countryCode: context.countryCode,
    context: {
      ucp: {
        platform: profileUrl,
        codes: [],
        ...(typeof webhookUrl === 'string' ? { webhookUrl } : {}),
      },
    },
  });
  await services.orders.initCartProviders(order);
  return respond(ucp, order._id, await applyCheckout(ucp, order._id, body), 201);
}

export async function getCheckout(ucp: UcpRequest): Promise<UcpResult> {
  const order = await findCheckout(ucp);
  if (!order) return notFound();
  await heartbeat(ucp, order.userId);
  return respond(ucp, order._id);
}

export async function updateCheckout(ucp: UcpRequest): Promise<UcpResult> {
  assertLineItems(ucp.body.line_items);
  await using lock = await ucp.context.modules.orders.acquireLock(ucp.context.params.id, 'ucp');
  const order = await findCheckout(ucp);
  if (!order) return notFound();
  await heartbeat(ucp, order.userId);
  if (isClosed(order)) {
    return respond(ucp, order._id, [
      unrecoverable('checkout_closed', 'This checkout can no longer be changed'),
    ]);
  }
  return respond(ucp, order._id, await applyCheckout(ucp, order._id, ucp.body));
}

export async function completeCheckout(ucp: UcpRequest): Promise<UcpResult> {
  const { context, body } = ucp;
  const { modules, services } = context;
  await using lock = await modules.orders.acquireLock(context.params.id, 'ucp');
  const order = await findCheckout(ucp);
  if (!order) return notFound();
  await heartbeat(ucp, order.userId);
  const current = await respond(ucp, order._id);
  if (current.body.status !== 'ready_for_complete') return current;

  const instruments = Array.isArray(body.payment?.instruments) ? body.payment.instruments : [];
  const [instrument] = instruments;
  const selected =
    instruments.length === 1 &&
    (await executableHandlers(ucp, order)).find(
      ({ provider }) => provider._id === instrument?.handler_id,
    );
  if (!selected) {
    const path =
      instruments.length === 1 ? '$.payment.instruments[0].handler_id' : '$.payment.instruments';
    return respond(ucp, order._id, [
      recoverable('payment_failed', path, 'Submit one instrument of an available payment handler'),
    ]);
  }

  {
    await using cartLock = await modules.orders.acquireLock(order._id, 'checkout');
    if (instrument.billing_address) {
      await modules.orders.updateCartFields(order._id, {
        billingAddress: {
          firstName: order.billingAddress?.firstName,
          lastName: order.billingAddress?.lastName,
          ...toAddress(instrument.billing_address),
        },
      });
    }
    await services.orders.selectPaymentProvider({ order, paymentProviderId: selected.provider._id });
    await services.orders.updateCalculation(order._id);
  }
  const recalculated = (await modules.orders.findOrder({ orderId: order._id }))!;
  const payment = await modules.orders.payments.findOrderPayment({
    orderPaymentId: recalculated.paymentId!,
  });
  const total = ({ calculation, currencyCode }: Order) =>
    OrderPricingSheet({ calculation, currencyCode }).total().amount;
  if (payment?.paymentProviderId !== selected.provider._id || total(recalculated) !== total(order)) {
    return respond(ucp, order._id, [
      warning(
        'totals_changed',
        '$.totals',
        'The totals changed, review the checkout before completing it',
      ),
    ]);
  }

  await modules.orders.payments.updateContext(payment._id, { paymentAction: null });
  let failure: Error | undefined;
  try {
    await services.orders.checkoutOrder(order._id, {
      paymentContext: selected.handler.paymentContext?.(instrument),
    });
  } catch (error) {
    failure = error;
  }
  const placed = (await modules.orders.findOrder({ orderId: order._id }))!;
  if (placed.status === null && failure) {
    if (failure.cause === 'LOCKED') throw failure;
    if (VALIDATION_ERRORS.includes(failure.name)) {
      return respond(ucp, order._id, [recoverable('invalid', undefined, failure.message)]);
    }
    logger.info(`Checkout of ${order._id} failed: ${failure.message}`, { orderId: order._id });
    await modules.orders.updateContext(order._id, { ucp: { ...order.context.ucp, declined: true } });
  }
  return respond(ucp, order._id);
}

export async function cancelCheckout(ucp: UcpRequest): Promise<UcpResult> {
  const { modules } = ucp.context;
  await using lock = await modules.orders.acquireLock(ucp.context.params.id, 'ucp');
  const order = await findCheckout(ucp);
  if (!order) return notFound();
  await heartbeat(ucp, order.userId);
  if (isClosed(order)) {
    return respond(ucp, order._id, [
      unrecoverable('checkout_closed', 'This checkout can no longer be canceled'),
    ]);
  }
  {
    await using cartLock = await modules.orders.acquireLock(order._id, 'checkout');
    await modules.orders.updateContext(order._id, { ucp: { ...order.context.ucp, canceled: true } });
  }
  return respond(ucp, order._id);
}
