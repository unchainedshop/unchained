import { PaymentDirector } from '@unchainedshop/core';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { PaymentProviderType, type PaymentProvider } from '@unchainedshop/core-payment';
import type { Order } from '@unchainedshop/core-orders';
import { ProductType } from '@unchainedshop/core-products';
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
import { acpContextOf, isACPAuthenticationRequired, isACPCanceled, serializeACPOrder } from './order.ts';
import {
  getACPFulfillmentOptions,
  hasAddress,
  missingCheckoutFields,
  serializeCheckoutSession,
} from './serializer.ts';

const invalidRequest = (code: string, message: string, param?: string) =>
  new ACPError(400, 'invalid_request', code, message, param ? { param } : {});

const serviceUnavailable = (code: string, message: string) =>
  new ACPError(503, 'service_unavailable', code, message);

const paymentProviderUnavailable = () =>
  serviceUnavailable(
    'payment_provider_unavailable',
    'The configured payment provider is unavailable for this cart',
  );

const unsupportedCurrency = (currency: string) =>
  invalidRequest(
    'unsupported_currency',
    `Currency ${currency} is not available for this checkout context`,
    '$.currency',
  );

const unavailableFulfillmentOption = {
  type: 'error',
  code: 'invalid',
  param: '$.selected_fulfillment_options[0].option_id',
  content_type: 'plain',
  content: 'The selected fulfillment option is not available',
};

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

const isEmailAddress = (value: unknown) =>
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const mapContact = (contact: { email?: string; phone_number?: string } | undefined, param: string) => {
  if (contact?.email != null && !isEmailAddress(contact.email)) {
    throw invalidRequest('invalid_email', 'The email address format is invalid', `${param}.email`);
  }
  return contact?.email || contact?.phone_number
    ? {
        ...(contact.email ? { emailAddress: contact.email } : {}),
        ...(contact.phone_number ? { telNumber: contact.phone_number } : {}),
      }
    : undefined;
};

const mapBuyer = (buyer?: { email?: string; phone_number?: string }) => {
  if (buyer && !buyer.email) {
    throw invalidRequest('invalid_buyer', 'buyer.email is required', '$.buyer.email');
  }
  return mapContact(buyer, '$.buyer');
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

const authenticationResultRequired = () =>
  invalidRequest(
    'requires_3ds',
    'This checkout session requires issuer authentication. The request must include authentication_result as provided by the issuer authentication flow.',
    '$.authentication_result',
  );

const assertNotCanceled = (order: Order) => {
  if (isACPCanceled(order)) {
    throw new ACPError(405, 'invalid_request', 'session_terminal', 'Session is terminal');
  }
};

const assertMutable = (order: Order) => {
  assertNotCanceled(order);
  if (order.status !== null) {
    throw new ACPError(405, 'invalid_request', 'session_terminal', 'Session is terminal');
  }
  if (isACPAuthenticationRequired(order)) throw authenticationResultRequired();
};

const lockACPSession = async (context: ACPContext, assertSession = assertMutable) => {
  const { _id } = await loadACPOrder(context);
  const lock = await context.modules.orders.acquireLock(_id, 'acp');
  try {
    const order = await loadACPOrder(context);
    assertSession(order);
    return Object.assign(order, { [Symbol.asyncDispose]: lock.release });
  } catch (error) {
    await lock.release();
    throw error;
  }
};

const isUnorderableProductError = (error: any) =>
  error?.cause === 'PRODUCT_INACTIVE' || typeof error?.extensions?.code === 'string';

const unorderableProductTypes = new Map<string, string>([
  [ProductType.CONFIGURABLE_PRODUCT, 'Choose one of the variants of this product'],
  [ProductType.PLAN_PRODUCT, 'Subscriptions cannot be paid with a single-use payment token'],
]);

const assertOrderableItems = async (context: ACPContext, items: { productId: string }[]) => {
  const products = await context.modules.products.findProducts({
    productIds: items.map(({ productId }) => productId),
    includeDrafts: true,
  });
  items.forEach(({ productId }, index) => {
    const product = products.find(({ _id }) => _id === productId);
    const param = `$.line_items[${index}].id`;
    if (!product) throw invalidRequest('product_not_found', `Product not found: ${productId}`, param);
    const reason = context.modules.products.isActive(product)
      ? unorderableProductTypes.get(product.type)
      : 'This product is inactive';
    if (reason) throw invalidRequest('product_unavailable', reason, param);
  });
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
    contact: mapBuyer(body.buyer),
    fulfillmentContact: mapContact(body.fulfillment_details, '$.fulfillment_details'),
    fulfillmentAddress: mapAddress(body.fulfillment_details?.address),
    billingAddress: mapAddress(body.payment_data?.billing_address),
    selectedOption: selectedOption as { option_id: string; type?: string } | undefined,
  };
};

const findFulfillmentOption = async (
  context: ACPContext,
  order: Order,
  selected: { option_id: string; type?: string },
) => {
  const options = await getACPFulfillmentOptions(order, context);
  return options.find(
    ({ id, type }) => id === selected.option_id && (!selected.type || selected.type === type),
  );
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
  const shipsToBillingAddress = !hasAddress(deliveryAddress);
  if (fulfillmentAddress) return billingAddress || !shipsToBillingAddress ? fulfillmentAddress : null;
  if (billingAddress && shipsToBillingAddress && hasAddress(previousBillingAddress)) {
    return previousBillingAddress;
  }
  return shipsToBillingAddress ? null : deliveryAddress;
};

const applyCheckoutUpdate = async (
  context: ACPContext,
  initialOrder: Order,
  {
    items,
    contact,
    fulfillmentContact,
    fulfillmentAddress,
    billingAddress,
    selectedOption,
  }: ReturnType<typeof parseCheckoutUpdate>,
) => {
  let order = initialOrder;

  if (items) {
    await assertOrderableItems(context, items);
    try {
      await context.services.orders.replaceCartProducts({ order, items }, context);
    } catch (error) {
      throw isUnorderableProductError(error)
        ? invalidRequest('product_unavailable', error.message, '$.line_items')
        : error;
    }
  }

  const delivery = order.deliveryId
    ? await context.modules.orders.deliveries.findDelivery({ orderDeliveryId: order.deliveryId })
    : null;
  const deliveryAddress = delivery?.context?.address;
  const orderBillingAddress =
    billingAddress || (hasAddress(deliveryAddress) ? undefined : fulfillmentAddress);
  if (contact || orderBillingAddress) {
    order =
      (await context.modules.orders.updateCartFields(order._id, {
        ...(contact ? { contact: { ...order.contact, ...contact } } : {}),
        ...(orderBillingAddress ? { billingAddress: orderBillingAddress } : {}),
      })) || order;
  }

  const option = selectedOption && (await findFulfillmentOption(context, order, selectedOption));
  if (option) {
    order = await context.services.orders.selectDeliveryProvider({
      order,
      deliveryProviderId: option.providerId,
      expectedType:
        option.type === 'pickup' ? DeliveryProviderType.PICKUP : DeliveryProviderType.SHIPPING,
      deliveryContext: option.deliveryContext,
    });
  }

  if (
    order.deliveryId &&
    (order.deliveryId !== delivery?._id || fulfillmentAddress || billingAddress || fulfillmentContact)
  ) {
    await context.modules.orders.deliveries.updateContext(order.deliveryId, {
      address: nextDeliveryAddress({
        fulfillmentAddress,
        billingAddress,
        previousBillingAddress: initialOrder.billingAddress,
        deliveryAddress,
      }),
      contact: { ...delivery?.context?.contact, ...fulfillmentContact },
    });
  }

  return { order, messages: selectedOption && !option ? [unavailableFulfillmentOption] : [] };
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
    throw error.name?.startsWith('PaymentProvider') ? paymentProviderUnavailable() : error;
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

    const session =
      (await context.modules.orders.updateContext(cart._id, {
        acp: {
          apiVersion: ACP_API_VERSION,
          createdAt: new Date().toISOString(),
          locale: context.locale.baseName,
          interventions: [body.capabilities.interventions?.supported]
            .flat()
            .filter((intervention) => typeof intervention === 'string'),
        },
      })) || cart;
    const { order, messages } = await applyCheckoutUpdate(context, session, update);
    await selectConfiguredPaymentProvider(context, order, paymentProvider);
    const calculated = await context.services.orders.updateCalculation(order._id);
    return { status: 201, body: await serializeCheckoutSession(calculated, context, messages) };
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
  await using order = await lockACPSession(context);
  const { messages } = await applyCheckoutUpdate(context, order, parseCheckoutUpdate(body));
  const updated = await context.services.orders.updateCalculation(order._id);
  return { status: 200, body: await serializeCheckoutSession(updated, context, messages) };
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

const checkoutErrorMessage = (error: any) => {
  if (error?.cause === 'PAYMENT_DECLINED') {
    return { type: 'error', code: 'payment_declined', content_type: 'plain', content: error.message };
  }
  if (isUnorderableProductError(error)) {
    return {
      type: 'error',
      code: 'invalid',
      param: '$.line_items',
      content_type: 'plain',
      content: error.message,
    };
  }
  return undefined;
};

const parseAuthenticationResult = (authenticationResult: any) => {
  if (authenticationResult === undefined) throw authenticationResultRequired();
  if (typeof authenticationResult?.outcome !== 'string') {
    throw invalidRequest(
      'invalid_authentication_result',
      'authentication_result.outcome is required',
      '$.authentication_result.outcome',
    );
  }
  return authenticationResult;
};

const withAuthenticationRequired = async (
  context: ACPContext,
  order: Order,
  authenticationRequired: boolean,
) =>
  isACPAuthenticationRequired(order) === authenticationRequired
    ? order
    : (await context.modules.orders.updateContext(order._id, {
        acp: { ...acpContextOf(order), authenticationRequired },
      })) || order;

const completedSession = async (order: Order, context: ACPContext): Promise<ACPRouteResult> => ({
  status: 200,
  body: {
    ...(await serializeCheckoutSession(order, context)),
    order: await serializeACPOrder(order, context),
  },
});

const chargeSession = async (
  context: ACPContext,
  order: Order,
  paymentContext: Record<string, unknown>,
): Promise<ACPRouteResult> => {
  try {
    const completed = await context.services.orders.checkoutOrder(order._id, { paymentContext });
    if (!completed) {
      throw new ACPError(500, 'processing_error', 'checkout_failed', 'Could not complete checkout');
    }
    return await completedSession(completed, context);
  } catch (error) {
    if (error?.cause === 'PAYMENT_REQUIRES_ACTION') {
      const session = await withAuthenticationRequired(context, order, true);
      return { status: 200, body: await serializeCheckoutSession(session, context) };
    }
    const message = checkoutErrorMessage(error);
    if (!message) throw error;
    const session =
      error.cause === 'PAYMENT_DECLINED'
        ? await withAuthenticationRequired(context, order, false)
        : order;
    return { status: 200, body: await serializeCheckoutSession(session, context, [message]) };
  }
};

export const completeCheckoutSession = async (
  _request: Request,
  context: ACPContext,
  body: Record<string, any>,
): Promise<ACPRouteResult> => {
  await using order = await lockACPSession(context, assertNotCanceled);
  if (order.status !== null) return await completedSession(order, context);
  const paymentContext = extractPaymentContext(body.payment_data);
  if (isACPAuthenticationRequired(order)) {
    return await chargeSession(context, order, {
      ...paymentContext,
      acpAuthenticationResult: parseAuthenticationResult(body.authentication_result),
    });
  }

  const update = parseCheckoutUpdate(body);
  if (!update.contact?.emailAddress && !order.contact?.emailAddress) {
    throw invalidRequest('invalid_buyer', 'buyer.email is required', '$.buyer.email');
  }
  const paymentProvider = await configuredPaymentProvider(context);

  const { order: updated, messages } = await applyCheckoutUpdate(context, order, update);
  const selected = await selectConfiguredPaymentProvider(context, updated, paymentProvider);
  const calculated = await context.services.orders.updateCalculation(order._id);
  if (calculated.paymentId !== selected.paymentId) throw paymentProviderUnavailable();
  const positions = await context.modules.orders.positions.findOrderPositions({ orderId: order._id });
  if (messages.length || missingCheckoutFields(calculated, positions).length) {
    return { status: 200, body: await serializeCheckoutSession(calculated, context, messages) };
  }
  return await chargeSession(context, calculated, paymentContext);
};

export const cancelCheckoutSession = async (
  _request: Request,
  context: ACPContext,
): Promise<ACPRouteResult> => {
  await using order = await lockACPSession(context);
  const canceled = await context.modules.orders.updateContext(order._id, {
    acp: { ...acpContextOf(order), canceled: true },
  });
  if (!canceled) {
    throw new ACPError(500, 'processing_error', 'cancel_failed', 'Could not cancel session');
  }
  return { status: 200, body: await serializeCheckoutSession(canceled, context) };
};
