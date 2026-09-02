import {
  ACP_API_VERSION,
  acpAcceptedHandlerIds,
  acpConfig,
  acpPaymentHandler,
  isAcpAdapterKeyAllowed,
  isAcpHandlerAccepted,
  type ACPContext,
} from './config.ts';
import { ACPError } from './error.ts';
import { verifyACPRequest } from './auth.ts';
import { buildACPProductFeed } from './feed.ts';
import { withIdempotency } from './idempotency.ts';
import { serializeCheckoutSession } from './serializer.ts';

interface RouteResult {
  status: number;
  body: unknown;
  contentType?: string;
}

const createGuest = async (context: ACPContext) => {
  const guestname = `guest-${crypto.randomUUID()}`;
  const guestUserId = await context.modules.users.createUser(
    {
      email: `${guestname}@unchained.local`,
      guest: true,
      password: null,
      initialPassword: true,
    } as any,
    { skipMessaging: true },
  );
  const user = await context.modules.users.updateHeartbeat(guestUserId, {
    remoteAddress: context.remoteAddress,
    remotePort: context.remotePort,
    userAgent: context.getHeader('user-agent'),
    locale: context.locale?.baseName,
    countryCode: context.countryCode,
  } as any);
  if (!user) throw new Error('Could not create guest user');
  return user;
};

const mapBuyer = (buyer: any) =>
  buyer
    ? {
        emailAddress: buyer.email,
        telNumber: buyer.phone_number,
      }
    : undefined;

const mapAddress = (address: any) =>
  address
    ? {
        firstName: address.name,
        lastName: '',
        company: address.company,
        addressLine: address.line_one,
        addressLine2: address.line_two,
        postalCode: address.postal_code,
        city: address.city,
        regionCode: address.state,
        countryCode: address.country,
      }
    : undefined;

const extractItems = (lineItems: any[] = []) =>
  lineItems.map((item) => ({
    productId: item.id,
    quantity: Number(item.quantity ?? 1),
  }));

const loadOrder = async (context: ACPContext, orderId: string) => {
  const order = await context.modules.orders.findOrder({ orderId });
  if (!order) {
    throw new ACPError(404, 'not_found_error', 'checkout_session_not_found', 'Session not found');
  }
  return order;
};

const updateOrder = async (context: ACPContext, order: any, body: any) => {
  if (body.line_items) {
    await context.modules.orders.positions.removePositions({ orderId: order._id });
    await context.services.orders.addMultipleCartProducts({
      orderId: order._id,
      items: extractItems(body.line_items),
      context: {
        localeContext: context.locale,
        userId: order.userId,
        countryCode: order.countryCode,
      },
    });
  }

  const contact = mapBuyer(body.buyer);
  const address = mapAddress(body.fulfillment_details?.address);
  if (contact || address) {
    await context.modules.orders.updateCartFields(order._id, {
      ...(contact ? { contact } : {}),
      ...(address ? { billingAddress: address } : {}),
    });
  }

  const selected = body.selected_fulfillment_options?.[0];
  if (selected?.option_id) {
    order = (await context.modules.orders.setDeliveryProvider(order._id, selected.option_id)) || order;
  }
  if (address && order.deliveryId) {
    await context.modules.orders.deliveries.updateContext(order.deliveryId, { address });
  }

  return context.services.orders.updateCalculation(order._id);
};

const createSession = async (context: ACPContext, body: any): Promise<RouteResult> => {
  if (!Array.isArray(body.line_items) || body.line_items.length === 0) {
    throw new ACPError(
      400,
      'invalid_request',
      'invalid_request',
      'line_items must contain at least one item',
      '$.line_items',
    );
  }
  if (!body.currency || typeof body.currency !== 'string') {
    throw new ACPError(400, 'invalid_request', 'invalid_request', 'currency is required', '$.currency');
  }
  if (!body.capabilities || typeof body.capabilities !== 'object') {
    throw new ACPError(
      400,
      'invalid_request',
      'invalid_request',
      'capabilities is required',
      '$.capabilities',
    );
  }
  if (!acpConfig.paymentProviderId) {
    throw new ACPError(
      503,
      'api_error',
      'payment_provider_not_configured',
      'UNCHAINED_ACP_PAYMENT_PROVIDER_ID is required',
    );
  }
  const paymentProvider = await context.modules.payment.paymentProviders.findProvider({
    paymentProviderId: acpConfig.paymentProviderId,
  });
  if (!isAcpAdapterKeyAllowed(paymentProvider?.adapterKey)) {
    throw new ACPError(
      503,
      'api_error',
      'payment_provider_not_configured',
      `UNCHAINED_ACP_PAYMENT_PROVIDER_ID must use an ACP-capable payment adapter. Allowed: ${acpConfig.paymentAdapterKeys.join(', ')}`,
    );
  }

  const user = await createGuest(context);
  let order = await context.services.orders.nextUserCart({
    user,
    countryCode: context.countryCode,
    forceCartCreation: true,
  });
  if (!order) throw new ACPError(500, 'api_error', 'cart_creation_failed', 'Could not create cart');
  if (order.currencyCode.toLowerCase() !== body.currency.toLowerCase()) {
    throw new ACPError(
      400,
      'invalid_request',
      'unsupported_currency',
      `Currency ${body.currency} is not available for this checkout context`,
      '$.currency',
    );
  }
  order =
    (await context.modules.orders.updateContext(order._id, {
      acp: {
        apiVersion: ACP_API_VERSION,
        createdAt: new Date().toISOString(),
      },
    })) || order;

  order =
    (await context.modules.orders.setPaymentProvider(order._id, acpConfig.paymentProviderId)) || order;

  const updated = await updateOrder(context, order, body);
  if (!updated) throw new ACPError(500, 'api_error', 'cart_update_failed', 'Could not update cart');
  return { status: 201, body: await serializeCheckoutSession(updated, context) };
};

const extractPaymentData = (paymentData: any) => {
  const token = paymentData?.instrument?.credential?.token || paymentData?.token;
  const provider = paymentData?.handler_id || paymentData?.provider || acpPaymentHandler.id;
  if (!token) {
    throw new ACPError(
      400,
      'invalid_request',
      'invalid_payment_data',
      'A delegated payment token is required',
      '$.payment_data',
    );
  }
  if (!isAcpHandlerAccepted(provider)) {
    throw new ACPError(
      400,
      'invalid_request',
      'unsupported_payment_handler',
      `Unsupported payment handler: ${provider}. Supported: ${acpAcceptedHandlerIds.join(', ')}`,
      '$.payment_data.handler_id',
    );
  }
  return { acpToken: token, acpHandlerId: provider };
};

const route = async (
  method: string,
  segments: string[],
  body: any,
  context: ACPContext,
): Promise<RouteResult> => {
  if (method === 'GET' && segments.length === 1 && segments[0] === 'feed.jsonl') {
    return {
      status: 200,
      body: await buildACPProductFeed(context),
      contentType: 'application/x-ndjson; charset=utf-8',
    };
  }
  if (segments[0] !== 'checkout_sessions') {
    throw new ACPError(404, 'not_found_error', 'not_found', 'ACP endpoint not found');
  }

  if (method === 'POST' && segments.length === 1) return createSession(context, body);

  const order = await loadOrder(context, segments[1]);

  if (method === 'GET' && segments.length === 2) {
    return { status: 200, body: await serializeCheckoutSession(order, context) };
  }

  if (method === 'POST' && segments.length === 2) {
    if (order.status !== null || (order.context as any)?.acp?.canceled) {
      throw new ACPError(405, 'invalid_request', 'session_terminal', 'Session is terminal');
    }
    const updated = await updateOrder(context, order, body);
    return { status: 200, body: await serializeCheckoutSession(updated!, context) };
  }

  if (method === 'POST' && segments[2] === 'complete') {
    if (order.status !== null || (order.context as any)?.acp?.canceled) {
      throw new ACPError(405, 'invalid_request', 'session_terminal', 'Session is terminal');
    }
    if (!body.buyer?.email) {
      throw new ACPError(
        400,
        'invalid_request',
        'invalid_request',
        'buyer.email is required',
        '$.buyer.email',
      );
    }
    const buyer = mapBuyer(body.buyer);
    const billingAddress = mapAddress(body.payment_data?.billing_address);
    if (buyer || billingAddress) {
      await context.modules.orders.updateCartFields(order._id, {
        ...(buyer ? { contact: buyer } : {}),
        ...(billingAddress ? { billingAddress } : {}),
      });
      await context.services.orders.updateCalculation(order._id);
    }
    const completed = await context.services.orders.checkoutOrder(order._id, {
      paymentContext: extractPaymentData(body.payment_data),
    });
    if (!completed) {
      throw new ACPError(500, 'api_error', 'checkout_failed', 'Could not complete checkout');
    }
    const session = await serializeCheckoutSession(completed, context);
    const permalinkBase = acpConfig.continueUrl?.replace(/\/$/, '');
    return {
      status: 200,
      body: {
        ...session,
        order: {
          id: completed._id,
          checkout_session_id: completed._id,
          permalink_url: permalinkBase
            ? `${permalinkBase}/${completed.orderNumber || completed._id}`
            : `https://example.invalid/orders/${completed.orderNumber || completed._id}`,
          status: completed.status?.toLowerCase(),
        },
      },
    };
  }

  if (method === 'POST' && segments[2] === 'cancel') {
    if (order.status !== null || (order.context as any)?.acp?.canceled) {
      throw new ACPError(405, 'invalid_request', 'session_terminal', 'Session is terminal');
    }
    const canceled = await context.modules.orders.updateCartFields(order._id, {
      meta: {
        acp: { ...((order.context as any)?.acp || {}), canceled: true },
      },
    });
    return { status: 200, body: await serializeCheckoutSession(canceled!, context) };
  }

  throw new ACPError(404, 'not_found_error', 'not_found', 'ACP endpoint not found');
};

const toResponse = (
  status: number,
  body: unknown,
  headers: Record<string, string>,
  contentType?: string,
) => {
  if (contentType) {
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': contentType, ...headers },
    });
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
};

export const handleACPRequest = async (request: Request, context: any): Promise<Response> => {
  const requestId = request.headers.get('request-id') || crypto.randomUUID();
  try {
    await verifyACPRequest(request);

    const url = new URL(request.url);
    let path = url.pathname;
    if (path.startsWith(acpConfig.apiPath)) path = path.slice(acpConfig.apiPath.length);
    const segments = path.split('/').filter(Boolean);
    const method = request.method.toUpperCase();
    const body = method === 'POST' ? await request.json().catch(() => ({})) : {};

    const idempotencyKey = request.headers.get('idempotency-key');
    const response =
      method === 'POST' && idempotencyKey
        ? await withIdempotency(
            `${request.headers.get('authorization')}:${url.pathname}`,
            idempotencyKey,
            body,
            () => route(method, segments, body, context),
          )
        : { ...(await route(method, segments, body, context)), replayed: false };

    const headers: Record<string, string> = {
      'Request-Id': requestId,
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      ...((response as any).replayed ? { 'Idempotent-Replayed': 'true' } : {}),
    };
    return toResponse(response.status, response.body, headers, (response as any).contentType);
  } catch (error) {
    if (error instanceof ACPError) {
      return toResponse(error.status, error.toJSON(), { 'Request-Id': requestId });
    }
    return toResponse(
      500,
      {
        type: 'api_error',
        code: 'internal_error',
        message: error instanceof Error ? error.message : 'Internal error',
      },
      { 'Request-Id': requestId },
    );
  }
};

export const wellKnownACPHandler = async (): Promise<Response> =>
  Response.json({
    protocol: 'agentic-commerce-protocol',
    api_versions: [ACP_API_VERSION],
    checkout_endpoint: `${acpConfig.apiPath}/checkout_sessions`,
    capabilities: ['checkout', acpConfig.paymentHandler.id],
  });
