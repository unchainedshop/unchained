import { PaymentDirector } from '@unchainedshop/core';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import type { Order } from '@unchainedshop/core-orders';
import {
  ACP_API_VERSION,
  acpConfig,
  getAcpAcceptedHandlerIds,
  isAcpAdapterKeyAllowed,
  isAcpHandlerAccepted,
  type ACPContext,
} from './config.ts';
import { ACPError } from './error.ts';
import type { ACPRouteResult } from './idempotency.ts';
import { serializeACPOrder } from './order.ts';
import { getACPFulfillmentOptions, serializeCheckoutSession } from './serializer.ts';

const invalidRequest = (code: string, message: string, param?: string) =>
  new ACPError(400, 'invalid_request', code, message, param ? { param } : {});

const serviceUnavailable = (code: string, message: string) =>
  new ACPError(503, 'service_unavailable', code, message);

const mapAddress = (address: any) => {
  if (!address) return undefined;
  const name = typeof address.name === 'string' ? address.name.trim() : '';
  const nameParts = name.split(/\s+/).filter(Boolean);
  return {
    firstName: nameParts.shift() || '',
    lastName: nameParts.join(' '),
    addressLine: address.line_one,
    addressLine2: address.line_two,
    postalCode: address.postal_code,
    city: address.city,
    regionCode: address.state,
    countryCode: address.country?.toUpperCase(),
  };
};

const mapContact = (body: Record<string, any>, order?: Order) => {
  const buyer = body.buyer;
  const fulfillment = body.fulfillment_details;
  if (!buyer && !fulfillment?.email && !fulfillment?.phone_number) return undefined;
  if (buyer && (!buyer.email || typeof buyer.email !== 'string')) {
    throw invalidRequest('invalid_buyer', 'buyer.email is required', '$.buyer.email');
  }
  return {
    ...order?.contact,
    ...(buyer?.email || fulfillment?.email ? { emailAddress: buyer?.email || fulfillment.email } : {}),
    ...(buyer?.phone_number || fulfillment?.phone_number
      ? { telNumber: buyer?.phone_number || fulfillment.phone_number }
      : {}),
  };
};

export const extractACPItems = (lineItems: unknown) => {
  if (!Array.isArray(lineItems)) {
    throw invalidRequest('invalid_line_items', 'line_items must be an array', '$.line_items');
  }
  return lineItems.map((item: any, index) => {
    if (!item || typeof item.id !== 'string' || !item.id) {
      throw invalidRequest(
        'invalid_line_item',
        'Each line item requires an id',
        `$.line_items[${index}].id`,
      );
    }
    const quantity = item.quantity ?? 1;
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw invalidRequest(
        'invalid_quantity',
        'Line item quantity must be a positive integer',
        `$.line_items[${index}].quantity`,
      );
    }
    return { productId: item.id, quantity };
  });
};

export const loadACPOrder = async (context: ACPContext) => {
  const orderId = context.params.id;
  const order = orderId && (await context.modules.orders.findOrder({ orderId }));
  if (!order || !(order.context as any)?.acp) {
    throw new ACPError(404, 'invalid_request', 'checkout_session_not_found', 'Session not found');
  }
  return order;
};

const assertMutable = (order: Order) => {
  if (order.status !== null || (order.context as any)?.acp?.canceled) {
    throw new ACPError(405, 'invalid_request', 'session_terminal', 'Session is terminal');
  }
};

const toCartInputError = (error: unknown): never => {
  const serviceError = error as Error & { details?: Record<string, any> };
  if (serviceError.name === 'ProductNotFoundError') {
    throw invalidRequest(
      'product_not_found',
      `Product not found: ${serviceError.details?.productId || 'unknown'}`,
      '$.line_items',
    );
  }
  if (serviceError.name === 'InvalidQuantityError') {
    throw invalidRequest('invalid_quantity', serviceError.message, '$.line_items');
  }
  throw error;
};

const updateOrder = async (context: ACPContext, initialOrder: Order, body: Record<string, any>) => {
  let order = initialOrder;
  let needsCalculation = false;

  if (Object.hasOwn(body, 'line_items')) {
    try {
      order = await context.services.orders.replaceCartProducts({
        orderId: order._id,
        items: extractACPItems(body.line_items),
        context: {
          localeContext: context.locale,
          userId: order.userId,
          countryCode: order.countryCode,
        },
      });
    } catch (error) {
      toCartInputError(error);
    }
  }

  const contact = mapContact(body, order);
  const address = mapAddress(body.fulfillment_details?.address || body.payment_data?.billing_address);
  if (contact || address) {
    order =
      (await context.modules.orders.updateCartFields(order._id, {
        ...(contact ? { contact } : {}),
        ...(address ? { billingAddress: address } : {}),
      })) || order;
    needsCalculation = true;
  }

  const selectedOptions = body.selected_fulfillment_options;
  if (selectedOptions !== undefined && (!Array.isArray(selectedOptions) || selectedOptions.length > 1)) {
    throw invalidRequest(
      'invalid_fulfillment_option',
      'Exactly one fulfillment option can be selected',
      '$.selected_fulfillment_options',
    );
  }
  const selected = selectedOptions?.[0];

  if (!selected && address && order.deliveryId) {
    await context.modules.orders.deliveries.updateContext(order.deliveryId, { address });
    needsCalculation = true;
  }
  if (needsCalculation) {
    order = await context.services.orders.updateCalculation(order._id);
  }

  if (selected) {
    if (typeof selected.option_id !== 'string') {
      throw invalidRequest(
        'invalid_fulfillment_option',
        'selected_fulfillment_options[0].option_id is required',
        '$.selected_fulfillment_options[0].option_id',
      );
    }
    const options = await getACPFulfillmentOptions(order, context);
    const option = options.find(({ id }) => id === selected.option_id);
    if (!option || (selected.type && selected.type !== option.type)) {
      throw invalidRequest(
        'invalid_fulfillment_option',
        'The selected fulfillment option is not available',
        '$.selected_fulfillment_options[0].option_id',
      );
    }
    try {
      order = await context.services.orders.selectDeliveryProvider({
        orderId: order._id,
        deliveryProviderId: option.providerId,
        expectedType:
          option.type === 'pickup' ? DeliveryProviderType.PICKUP : DeliveryProviderType.SHIPPING,
        deliveryContext: {
          ...option.deliveryContext,
          ...(address && option.type === 'shipping' ? { address } : {}),
        },
      });
    } catch (error) {
      const serviceError = error as Error;
      if (serviceError.name.includes('DeliveryProvider')) {
        throw invalidRequest(
          'invalid_fulfillment_option',
          'The selected fulfillment option is not available',
          '$.selected_fulfillment_options[0].option_id',
        );
      }
      throw error;
    }
  }

  return order;
};

const configuredPaymentProvider = async (context: ACPContext) => {
  if (!acpConfig.paymentProviderId) {
    throw serviceUnavailable(
      'payment_provider_not_configured',
      'UNCHAINED_ACP_PAYMENT_PROVIDER_ID is required',
    );
  }
  const provider = await context.modules.payment.paymentProviders.findProvider({
    paymentProviderId: acpConfig.paymentProviderId,
  });
  if (
    !provider ||
    provider.type !== PaymentProviderType.GENERIC ||
    !isAcpAdapterKeyAllowed(provider.adapterKey) ||
    !PaymentDirector.getAdapter(provider.adapterKey)
  ) {
    throw serviceUnavailable(
      'payment_provider_not_configured',
      'The configured payment provider is not an active ACP-capable adapter',
    );
  }
  return provider;
};

const selectConfiguredPaymentProvider = async (context: ACPContext, order: Order) => {
  const provider = await configuredPaymentProvider(context);
  try {
    const updated = await context.services.orders.selectPaymentProvider({
      orderId: order._id,
      paymentProviderId: provider._id,
      expectedType: PaymentProviderType.GENERIC,
    });
    const payment = updated.paymentId
      ? await context.modules.orders.payments.findOrderPayment({
          orderPaymentId: updated.paymentId,
        })
      : null;
    if (payment?.paymentProviderId !== provider._id) {
      throw serviceUnavailable(
        'payment_provider_unavailable',
        'The configured payment provider is unavailable for this cart',
      );
    }
    return updated;
  } catch (error) {
    if (error instanceof ACPError) throw error;
    const serviceError = error as Error;
    if (serviceError.name.includes('PaymentProvider')) {
      throw serviceUnavailable(
        'payment_provider_unavailable',
        'The configured payment provider is unavailable for this cart',
      );
    }
    throw error;
  }
};

export const createCheckoutSession = async (
  _request: Request,
  context: ACPContext,
  body: Record<string, any>,
): Promise<ACPRouteResult> => {
  if (!Array.isArray(body.line_items) || body.line_items.length === 0) {
    throw invalidRequest(
      'invalid_line_items',
      'line_items must contain at least one item',
      '$.line_items',
    );
  }
  const items = extractACPItems(body.line_items);
  if (typeof body.currency !== 'string' || !body.currency) {
    throw invalidRequest('invalid_currency', 'currency is required', '$.currency');
  }
  if (body.currency.toLowerCase() !== context.currencyCode.toLowerCase()) {
    throw invalidRequest(
      'unsupported_currency',
      `Currency ${body.currency} is not available for this checkout context`,
      '$.currency',
    );
  }
  if (!body.capabilities || typeof body.capabilities !== 'object' || Array.isArray(body.capabilities)) {
    throw invalidRequest('invalid_capabilities', 'capabilities is required', '$.capabilities');
  }
  await configuredPaymentProvider(context);

  const products = await Promise.all(
    items.map(({ productId }) => context.modules.products.findProduct({ productId })),
  );
  const missingProductIndex = products.findIndex((product) => !product);
  if (missingProductIndex !== -1) {
    throw invalidRequest(
      'product_not_found',
      `Product not found: ${items[missingProductIndex].productId}`,
      `$.line_items[${missingProductIndex}].id`,
    );
  }

  let userId: string | undefined;
  try {
    const { user, cart } = await context.services.users.provisionGuest({
      countryCode: context.countryCode,
      forceCartCreation: true,
      lastLogin: {
        remoteAddress: context.remoteAddress,
        remotePort: context.remotePort,
        userAgent: context.getHeader('user-agent'),
        locale: context.locale.baseName,
        countryCode: context.countryCode,
      },
    });
    userId = user._id;
    if (!cart) throw serviceUnavailable('cart_creation_failed', 'Could not create cart');
    if (cart.currencyCode.toLowerCase() !== body.currency.toLowerCase()) {
      throw invalidRequest(
        'unsupported_currency',
        `Currency ${body.currency} is not available for this checkout context`,
        '$.currency',
      );
    }

    let order =
      (await context.modules.orders.updateContext(cart._id, {
        acp: { apiVersion: ACP_API_VERSION, createdAt: new Date().toISOString() },
      })) || cart;
    order = await updateOrder(context, order, body);
    order = await selectConfiguredPaymentProvider(context, order);
    return { status: 201, body: await serializeCheckoutSession(order, context) };
  } catch (error) {
    if (userId) await context.services.users.deleteUser({ userId }).catch(() => undefined);
    throw error;
  }
};

export const getCheckoutSession = async (
  _request: Request,
  context: ACPContext,
): Promise<ACPRouteResult> => {
  const order = await loadACPOrder(context);
  return { status: 200, body: await serializeCheckoutSession(order, context) };
};

export const updateCheckoutSession = async (
  _request: Request,
  context: ACPContext,
  body: Record<string, any>,
): Promise<ACPRouteResult> => {
  const order = await loadACPOrder(context);
  assertMutable(order);
  const updated = await updateOrder(context, order, body);
  return { status: 200, body: await serializeCheckoutSession(updated, context) };
};

const extractPaymentContext = (paymentData: any) => {
  const token = paymentData?.instrument?.credential?.token;
  const handlerId = paymentData?.handler_id;
  if (!token || typeof token !== 'string') {
    throw invalidRequest(
      'invalid_payment_data',
      'A delegated payment token is required',
      '$.payment_data.instrument.credential.token',
    );
  }
  if (!isAcpHandlerAccepted(handlerId)) {
    throw invalidRequest(
      'unsupported_payment_handler',
      `Unsupported payment handler: ${handlerId || 'missing'}. Supported: ${getAcpAcceptedHandlerIds().join(', ')}`,
      '$.payment_data.handler_id',
    );
  }
  return { acpToken: token, acpHandlerId: handlerId };
};

export const completeCheckoutSession = async (
  _request: Request,
  context: ACPContext,
  body: Record<string, any>,
): Promise<ACPRouteResult> => {
  let order = await loadACPOrder(context);
  assertMutable(order);
  order = await updateOrder(context, order, body);
  if (!order.contact?.emailAddress) {
    throw invalidRequest('invalid_buyer', 'buyer.email is required', '$.buyer.email');
  }
  order = await selectConfiguredPaymentProvider(context, order);

  const completed = await context.services.orders.checkoutOrder(order._id, {
    paymentContext: extractPaymentContext(body.payment_data),
  });
  if (!completed) {
    throw new ACPError(500, 'processing_error', 'checkout_failed', 'Could not complete checkout');
  }
  return {
    status: 200,
    body: {
      ...(await serializeCheckoutSession(completed, context)),
      order: serializeACPOrder(completed),
    },
  };
};

export const cancelCheckoutSession = async (
  _request: Request,
  context: ACPContext,
): Promise<ACPRouteResult> => {
  const order = await loadACPOrder(context);
  assertMutable(order);
  const canceled = await context.modules.orders.updateCartFields(order._id, {
    meta: { acp: { ...((order.context as any)?.acp || {}), canceled: true } },
  });
  if (!canceled) {
    throw new ACPError(500, 'processing_error', 'cancel_failed', 'Could not cancel session');
  }
  return { status: 200, body: await serializeCheckoutSession(canceled, context) };
};
