import type StripeClient from 'stripe';
import { createLogger } from '@unchainedshop/logger';
import type { UnchainedCore } from '@unchainedshop/core';
import { stripe } from './stripe.ts';

const logger = createLogger('unchained:stripe:handler');

export const WebhookEventTypes = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  SETUP_INTENT_SUCCEEDED: 'setup_intent.succeeded',
} as const;

const supportedEventTypes = new Set<string>(Object.values(WebhookEventTypes));

const jsonResponse = (body: Record<string, unknown>, status = 200) => Response.json(body, { status });

const processWebhookEvent = async (
  event: StripeClient.Event,
  context: UnchainedCore,
  environment: string,
) => {
  if (!supportedEventTypes.has(event.type)) {
    logger.info('Unhandled Stripe webhook event type', { type: event.type });
    return jsonResponse({
      success: false,
      ignored: true,
      name: 'UNHANDLED_EVENT_TYPE',
      message: `Unhandled event type: ${event.type}. Supported types: ${[...supportedEventTypes].join(', ')}`,
    });
  }

  const eventObject = event.data.object as { metadata?: Record<string, string> };
  const eventEnvironment = eventObject.metadata?.environment || '';
  if (eventEnvironment !== environment) {
    logger.info('Unhandled Stripe webhook environment', {
      type: event.type,
      environment: eventEnvironment,
    });
    return jsonResponse({
      success: false,
      ignored: true,
      name: 'UNHANDLED_EVENT_ENVIRONMENT',
      message: `Unhandled event environment: ${eventEnvironment}. Supported environment: ${environment}`,
    });
  }

  const { modules, services } = context;

  if (event.type === WebhookEventTypes.PAYMENT_INTENT_SUCCEEDED) {
    const paymentIntent = event.data.object as StripeClient.PaymentIntent;
    const orderPaymentId = paymentIntent.metadata?.orderPaymentId;
    if (!orderPaymentId) throw new Error('Stripe payment intent has no orderPaymentId metadata');

    const orderPayment = await modules.orders.payments.findOrderPayment({ orderPaymentId });
    if (!orderPayment) {
      throw new Error(`order payment not found with orderPaymentId: ${orderPaymentId}`);
    }
    await modules.orders.payments.logEvent(orderPaymentId, event);

    const order = await services.orders.checkoutOrder(orderPayment.orderId, {
      paymentContext: { paymentIntentId: paymentIntent.id },
    });
    if (!order) throw new Error(`Order with id ${orderPayment.orderId} not found`);

    logger.info('Stripe webhook checkout successful', {
      orderPaymentId,
      orderId: order._id,
      type: event.type,
    });
    return jsonResponse({ success: true, message: 'checkout successful', orderId: order._id });
  }

  const setupIntent = event.data.object as StripeClient.SetupIntent;
  const { paymentProviderId, userId } = setupIntent.metadata || {};
  if (!paymentProviderId || !userId) {
    throw new Error('Stripe setup intent has no paymentProviderId or userId metadata');
  }

  const paymentCredentials = await services.orders.registerPaymentCredentials(paymentProviderId, {
    transactionContext: { setupIntentId: setupIntent.id },
    userId,
  });

  logger.info('Stripe webhook credential registration successful', {
    userId,
    paymentProviderId,
    paymentCredentialsId: paymentCredentials?._id,
    type: event.type,
  });
  return jsonResponse({
    success: true,
    message: 'payment credentials registration successful',
    paymentCredentialsId: paymentCredentials?._id,
  });
};

export const createStripeWebhookHandler =
  ({
    stripeClient,
    endpointSecret,
    environment,
  }: {
    stripeClient?: StripeClient;
    endpointSecret?: string;
    environment?: string;
  } = {}) =>
  async (request: Request, context: UnchainedCore): Promise<Response> => {
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      logger.warn('Stripe webhook signature header was not provided');
      return jsonResponse(
        {
          success: false,
          message: 'stripe-signature header was not provided for webhook',
          name: 'MISSING_SIGNATURE',
        },
        400,
      );
    }

    const resolvedEndpointSecret = endpointSecret ?? process.env.STRIPE_ENDPOINT_SECRET;
    if (!resolvedEndpointSecret) {
      logger.error('STRIPE_ENDPOINT_SECRET is required for webhook handling');
      return jsonResponse(
        {
          success: false,
          message: 'env STRIPE_ENDPOINT_SECRET is required for webhook handling',
          name: 'MISSING_ENDPOINT_SECRET',
        },
        500,
      );
    }

    const rawBody = await request.text();
    let event: StripeClient.Event;
    try {
      event = (stripeClient || stripe).webhooks.constructEvent(
        rawBody,
        signature,
        resolvedEndpointSecret,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const name = error instanceof Error ? error.name : 'SIGNATURE_VERIFICATION_FAILED';
      logger.warn('Stripe webhook signature verification failed', { error: message });
      return jsonResponse({ success: false, message, name }, 400);
    }

    try {
      return await processWebhookEvent(
        event,
        context,
        environment ?? process.env.STRIPE_WEBHOOK_ENVIRONMENT ?? '',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const name = error instanceof Error ? error.name : 'Error';
      logger.error('Stripe webhook processing failed', { error: message, type: event.type });
      return jsonResponse({ success: false, message, name }, 500);
    }
  };

export const stripeWebhookHandler = createStripeWebhookHandler();
