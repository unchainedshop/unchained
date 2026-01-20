import { createLogger } from '@unchainedshop/logger';
import type { UnchainedCore } from '@unchainedshop/core';
import { stripe } from './stripe.ts';

const logger = createLogger('unchained:stripe:handler');

export const WebhookEventTypes = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  SETUP_INTENT_SUCCEEDED: 'setup_intent.succeeded',
};

export async function stripeWebhookHandler(request: Request, context: UnchainedCore): Promise<Response> {
  try {
    const { modules, services } = context;

    const sig = request.headers.get('stripe-signature');
    if (!sig) {
      logger.error('stripe-signature header was not provided for webhook');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'stripe-signature header was not provided for webhook',
          name: 'MISSING_SIGNATURE',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!process.env.STRIPE_ENDPOINT_SECRET) {
      logger.error('env STRIPE_ENDPOINT_SECRET is required for webhook handling');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'env STRIPE_ENDPOINT_SECRET is required for webhook handling',
          name: 'MISSING_ENDPOINT_SECRET',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Read raw body for signature validation
    const rawBody = await request.text();

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_ENDPOINT_SECRET);
    } catch (err: any) {
      logger.error(`Error constructing event: ${err.message}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: err.message,
          name: err.name || 'SIGNATURE_VERIFICATION_FAILED',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Check if event type is supported
    if (!Object.values(WebhookEventTypes).includes(event.type)) {
      logger.info(`unhandled event type`, {
        type: event.type,
      });
      return new Response(
        JSON.stringify({
          success: false,
          ignored: true,
          name: 'UNHANDLED_EVENT_TYPE',
          message: `Unhandled event type: ${event.type}. Supported types: ${Object.values(WebhookEventTypes).join(', ')}`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Check environment metadata
    const environmentInMetadata = event.data?.object?.metadata?.environment || '';
    const environmentInEnv = process.env.STRIPE_WEBHOOK_ENVIRONMENT || '';
    if (environmentInMetadata !== environmentInEnv) {
      logger.info(`unhandled event environment`, {
        type: event.type,
        environment: environmentInMetadata,
      });
      return new Response(
        JSON.stringify({
          success: false,
          ignored: true,
          name: 'UNHANDLED_EVENT_ENVIRONMENT',
          message: `Unhandled event environment: ${environmentInMetadata}. Supported environment: ${environmentInEnv}`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    logger.info(`Processing event`, {
      type: event.type,
    });

    // Handle payment_intent.succeeded
    if (event.type === WebhookEventTypes.PAYMENT_INTENT_SUCCEEDED) {
      const paymentIntent = event.data.object;
      const { orderPaymentId } = paymentIntent.metadata || {};

      logger.info(`checkout with orderPaymentId: ${orderPaymentId}`, {
        type: event.type,
      });

      await modules.orders.payments.logEvent(orderPaymentId, event);
      const orderPayment = await modules.orders.payments.findOrderPayment({
        orderPaymentId,
      });

      if (!orderPayment) {
        throw new Error(`order payment not found with orderPaymentId: ${orderPaymentId}`);
      }

      const order = await services.orders.checkoutOrder(orderPayment.orderId, {
        paymentContext: {
          paymentIntentId: paymentIntent.id,
        },
      });

      if (!order) throw new Error(`Order with id ${orderPayment.orderId} not found`);

      logger.info(`checkout successful`, {
        orderPaymentId,
        orderId: order._id,
        type: event.type,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'checkout successful',
          orderId: order._id,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Handle setup_intent.succeeded
    if (event.type === WebhookEventTypes.SETUP_INTENT_SUCCEEDED) {
      const setupIntent = event.data.object;
      const { paymentProviderId, userId } = setupIntent.metadata || {};

      logger.info(`registered payment credential with paymentProviderId: ${paymentProviderId}`, {
        type: event.type,
        userId,
      });

      const paymentCredentials = await services.orders.registerPaymentCredentials(paymentProviderId, {
        transactionContext: {
          setupIntentId: setupIntent.id,
        },
        userId,
      });

      logger.info(`payment credentials registration successful`, {
        userId,
        paymentProviderId,
        paymentCredentialsId: paymentCredentials?._id,
        type: event.type,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'payment credentials registration successful',
          paymentCredentialsId: paymentCredentials?._id,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Shouldn't reach here, but just in case
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Unhandled event type',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error: any) {
    logger.error(error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
        name: error.name,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
