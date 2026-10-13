import { PaymentDirector } from '@unchainedshop/core';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { PaymentProviderType, type PaymentProvider } from '@unchainedshop/core-payment';
import type { Order } from '@unchainedshop/core-orders';
import {
  ACP_API_VERSION,
  acpConfig,
  getACPAcceptedHandlerIds,
  isACPAdapterKeyAllowed,
  isACPHandlerAccepted,
  type ACPContext,
} from './config.ts';
import { ACPError } from './error.ts';
import type { ACPRouteResult } from './idempotency.ts';
import { acpContextOf, isACPCanceled, serializeACPOrder } from './order.ts';
import { getACPFulfillmentOptions, hasAddress, serializeCheckoutSession } from './serializer.ts';

const invalidRequest = (code: string, message: string, param?: string) =>
  new ACPError(400, 'invalid_request', code, message, param ? { param } : {});

const serviceUnavailable = (code: string, message: string) =>
  new ACPError(503, 'service_unavailable', code, message);

const unsupportedCurrency = (currency: string) =>
  invalidRequest(
    'unsupported_currency',
    `Currency ${currency} is not available for this checkout context`,
    '$.currency',
  );

const unavailableFulfillmentOption = () =>
  invalidRequest(
    'invalid_fulfillment_option',
    'The selected fulfillment option is not available',
    '$.selected_fulfillment_options[0].option_id',
  );

const mapAddress = (address: any) => {
  if (!address) return undefined;
  const name = typeof address.name === 'string' ? address.name.trim() : '';
  const nameParts = name.split(/\s+/).filter(Boolean);
  const mappedAddress = {
    firstName: nameParts.shift() || '',
    lastName: nameParts.join(' '),
    addressLine: address.line_one,
    addressLine2: address.line_two,
    postalCode: address.postal_code,
    city: address.city,
    regionCode: address.state,
    countryCode: address.country?.toUpperCase(),
  };
  return hasAddress(mappedAddress) ? mappedAddress : undefined;
};

const mapContact = (body: Record<string, any>) => {
  const buyer = body.buyer;
  const fulfillment = body.fulfillment_details;
  if (!buyer && !fulfillment?.email && !fulfillment?.phone_number) return undefined;
  if (buyer && (!buyer.email || typeof buyer.email !== 'string')) {
    throw invalidRequest('invalid_buyer', 'buyer.email is required', '$.buyer.email');
  }
  return {
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
  if (!order || !acpContextOf(order)) {
    throw new ACPError(404, 'invalid_request', 'checkout_session_not_found', 'Session not found');
  }
  return order;
};

const assertMutable = (order: Order) => {
  if (order.status !== null || isACPCanceled(order)) {
    throw new ACPError(405, 'invalid_request', 'session_terminal', 'Session is terminal');
  }
};

const lineItemError = (
  items: { productId: string }[],
  error: Error & { details?: { productId?: string } },
) => {
  if (error.name !== 'ProductNotFoundError') return error;
  const index = items.findIndex(({ productId }) => productId === error.details?.productId);
  return invalidRequest(
    'product_not_found',
    `Product not found: ${error.details?.productId}`,
    `$.line_items[${index}].id`,
  );
};

const parseCheckoutUpdate = (body: Record<string, any>) => {
  const selectedOptions = body.selected_fulfillment_options;
  if (selectedOptions !== undefined && (!Array.isArray(selectedOptions) || selectedOptions.length > 1)) {
    throw invalidRequest(
      'invalid_fulfillment_option',
      'Exactly one fulfillment option can be selected',
      '$.selected_fulfillment_options',
    );
  }
  const selectedOption = selectedOptions?.[0];
  if (selectedOption && typeof selectedOption.option_id !== 'string') {
    throw invalidRequest(
      'invalid_fulfillment_option',
      'selected_fulfillment_options[0].option_id is required',
      '$.selected_fulfillment_options[0].option_id',
    );
  }

  return {
    items: Object.hasOwn(body, 'line_items') ? extractACPItems(body.line_items) : undefined,
    contact: mapContact(body),
    fulfillmentAddress: mapAddress(body.fulfillment_details?.address),
    billingAddress: mapAddress(body.payment_data?.billing_address),
    selectedOption: selectedOption as { option_id: string; type?: string } | undefined,
  };
};

const resolveFulfillmentOption = async (
  context: ACPContext,
  order: Order,
  selected: { option_id: string; type?: string },
) => {
  const options = await getACPFulfillmentOptions(order, context);
  const option = options.find(({ id }) => id === selected.option_id);
  if (!option || (selected.type && selected.type !== option.type)) {
    throw unavailableFulfillmentOption();
  }
  return option;
};

const nextDeliveryAddress = ({
  fulfillmentAddress,
  billingAddress,
  previousBillingAddress,
  deliveryAddress,
}: {
  fulfillmentAddress?: object;
  billingAddress?: object;
  previousBillingAddress?: object;
  deliveryAddress?: object | null;
}) => {
  if (fulfillmentAddress && billingAddress) return fulfillmentAddress;
  if (!fulfillmentAddress && !hasAddress(deliveryAddress) && hasAddress(previousBillingAddress)) {
    return previousBillingAddress;
  }
  if (deliveryAddress != null && (fulfillmentAddress || !hasAddress(deliveryAddress))) return null;
  return undefined;
};

const applyCheckoutUpdate = async (
  context: ACPContext,
  initialOrder: Order,
  {
    items,
    contact,
    fulfillmentAddress,
    billingAddress,
    selectedOption,
  }: ReturnType<typeof parseCheckoutUpdate>,
) => {
  const option =
    selectedOption && (await resolveFulfillmentOption(context, initialOrder, selectedOption));
  let order = initialOrder;

  if (items) {
    try {
      await context.services.orders.replaceCartProducts({ order, items }, context);
    } catch (error) {
      throw lineItemError(items, error);
    }
  }

  const orderBillingAddress = billingAddress || fulfillmentAddress;
  if (contact || orderBillingAddress) {
    order =
      (await context.modules.orders.updateCartFields(order._id, {
        ...(contact ? { contact: { ...order.contact, ...contact } } : {}),
        ...(orderBillingAddress ? { billingAddress: orderBillingAddress } : {}),
      })) || order;
  }

  if (option) {
    try {
      order = await context.services.orders.selectDeliveryProvider({
        order,
        deliveryProviderId: option.providerId,
        expectedType:
          option.type === 'pickup' ? DeliveryProviderType.PICKUP : DeliveryProviderType.SHIPPING,
        deliveryContext: option.deliveryContext,
      });
    } catch (error) {
      throw error.name?.startsWith('DeliveryProvider') ? unavailableFulfillmentOption() : error;
    }
  }

  if (option?.type !== 'pickup' && order.deliveryId && (fulfillmentAddress || billingAddress)) {
    const delivery = await context.modules.orders.deliveries.findDelivery({
      orderDeliveryId: order.deliveryId,
    });
    const address = nextDeliveryAddress({
      fulfillmentAddress,
      billingAddress,
      previousBillingAddress: initialOrder.billingAddress,
      deliveryAddress: delivery?.context?.address,
    });
    if (address !== undefined) {
      await context.modules.orders.deliveries.updateContext(order.deliveryId, { address });
    }
  }

  return order;
};

const configuredPaymentProvider = async (context: ACPContext) => {
  const provider = await context.modules.payment.paymentProviders.findProvider({
    paymentProviderId: acpConfig.paymentProviderId!,
  });
  if (
    !provider ||
    provider.type !== PaymentProviderType.GENERIC ||
    !isACPAdapterKeyAllowed(provider.adapterKey) ||
    !PaymentDirector.getAdapter(provider.adapterKey)
  ) {
    throw serviceUnavailable(
      'payment_provider_not_configured',
      'The configured payment provider is not an active ACP-capable adapter',
    );
  }
  return provider;
};

const selectConfiguredPaymentProvider = async (
  context: ACPContext,
  order: Order,
  provider: PaymentProvider,
) => {
  try {
    return await context.services.orders.selectPaymentProvider({
      order,
      paymentProviderId: provider._id,
      expectedType: PaymentProviderType.GENERIC,
    });
  } catch (error) {
    throw error.name?.startsWith('PaymentProvider')
      ? serviceUnavailable(
          'payment_provider_unavailable',
          'The configured payment provider is unavailable for this cart',
        )
      : error;
  }
};

export const createCheckoutSession = async (
  _request: Request,
  context: ACPContext,
  body: Record<string, any>,
): Promise<ACPRouteResult> => {
  const update = parseCheckoutUpdate(body);
  if (!update.items?.length) {
    throw invalidRequest(
      'invalid_line_items',
      'line_items must contain at least one item',
      '$.line_items',
    );
  }
  if (typeof body.currency !== 'string' || !body.currency) {
    throw invalidRequest('invalid_currency', 'currency is required', '$.currency');
  }
  if (body.currency.toLowerCase() !== context.currencyCode.toLowerCase()) {
    throw unsupportedCurrency(body.currency);
  }
  if (!body.capabilities || typeof body.capabilities !== 'object' || Array.isArray(body.capabilities)) {
    throw invalidRequest('invalid_capabilities', 'capabilities is required', '$.capabilities');
  }
  const paymentProvider = await configuredPaymentProvider(context);

  const { user, cart } = await context.services.users.provisionGuest({
    countryCode: context.countryCode,
    forceCartCreation: true,
    lastLogin: {
      remoteAddress: context.remoteAddress,
      remotePort: context.remotePort,
      userAgent: context.getHeader('user-agent'),
      locale: context.locale.baseName,
    },
  });
  try {
    if (!cart) throw serviceUnavailable('cart_creation_failed', 'Could not create cart');
    if (cart.currencyCode.toLowerCase() !== body.currency.toLowerCase()) {
      throw unsupportedCurrency(body.currency);
    }

    let order =
      (await context.modules.orders.updateContext(cart._id, {
        acp: { apiVersion: ACP_API_VERSION, createdAt: new Date().toISOString() },
      })) || cart;
    order = await applyCheckoutUpdate(context, order, update);
    await selectConfiguredPaymentProvider(context, order, paymentProvider);
    order = await context.services.orders.updateCalculation(order._id);
    return { status: 201, body: await serializeCheckoutSession(order, context) };
  } catch (error) {
    try {
      await context.services.users.deleteUser({ userId: user._id });
    } catch {
      /**/
    }
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
  await applyCheckoutUpdate(context, order, parseCheckoutUpdate(body));
  const updated = await context.services.orders.updateCalculation(order._id);
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
  if (!isACPHandlerAccepted(handlerId)) {
    throw invalidRequest(
      'unsupported_payment_handler',
      `Unsupported payment handler: ${handlerId || 'missing'}. Supported: ${getACPAcceptedHandlerIds().join(', ')}`,
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
  const order = await loadACPOrder(context);
  assertMutable(order);
  const update = parseCheckoutUpdate(body);
  const paymentContext = extractPaymentContext(body.payment_data);
  if (!update.contact?.emailAddress && !order.contact?.emailAddress) {
    throw invalidRequest('invalid_buyer', 'buyer.email is required', '$.buyer.email');
  }
  const paymentProvider = await configuredPaymentProvider(context);

  const updated = await applyCheckoutUpdate(context, order, update);
  await selectConfiguredPaymentProvider(context, updated, paymentProvider);
  await context.services.orders.updateCalculation(order._id);

  const completed = await context.services.orders.checkoutOrder(order._id, { paymentContext });
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
  const canceled = await context.modules.orders.updateContext(order._id, {
    acp: { ...acpContextOf(order), canceled: true },
  });
  if (!canceled) {
    throw new ACPError(500, 'processing_error', 'cancel_failed', 'Could not cancel session');
  }
  return { status: 200, body: await serializeCheckoutSession(canceled, context) };
};
