import { Context } from '@unchainedshop/api';
import { createLogger } from '@unchainedshop/logger';
import stripeClient from './stripe.js';

const logger = createLogger('unchained:core-payment:stripe:webhook');

export const WebhookEventTypes = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  SETUP_INTENT_SUCCEEDED: 'setup_intent.succeeded',
};

export const stripeHandler = async (request, response) => {
  const resolvedContext = request.unchainedContext as Context;
  const { modules } = resolvedContext;

  let event;

  try {
    const stripe = stripeClient();
    const sig = request.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_ENDPOINT_SECRET);
  } catch (err) {
    logger.error(`Error constructing event: ${err.message}`);
    response.writeHead(400);
    response.end(err.message);
    return;
  }

  if (!Object.values(WebhookEventTypes).includes(event.type)) {
    logger.verbose(`unhandled event type`, {
      type: event.type,
    });
    response.writeHead(200);
    response.end(
      JSON.stringify({
        ignored: true,
        message: `Unhandled event type: ${event.type}. Supported types: ${Object.values(WebhookEventTypes).join(', ')}`,
      }),
    );
    return;
  }

  const environmentInMetadata = event.data?.object?.metadata?.environment || '';
  const environmentInEnv = process.env.STRIPE_WEBHOOK_ENVIRONMENT || '';
  if (environmentInMetadata !== environmentInEnv) {
    logger.verbose(`unhandled event environment`, {
      type: event.type,
      environment: environmentInMetadata,
    });
    response.writeHead(200);
    response.end(
      JSON.stringify({
        ignored: true,
        message: `Unhandled event environment: ${environmentInMetadata}. Supported environment: ${environmentInEnv}`,
      }),
    );
    return;
  }

  logger.verbose(`Processing event`, {
    type: event.type,
  });
  try {
    if (event.type === WebhookEventTypes.PAYMENT_INTENT_SUCCEEDED) {
      const paymentIntent = event.data.object;
      const { orderPaymentId } = paymentIntent.metadata || {};

      logger.verbose(`checkout with orderPaymentId: ${orderPaymentId}`, {
        type: event.type,
      });

      await modules.orders.payments.logEvent(orderPaymentId, event);
      const orderPayment = await modules.orders.payments.findOrderPayment({
        orderPaymentId,
      });

      if (!orderPayment) {
        throw new Error(`order payment not found with orderPaymentId: ${orderPaymentId}`);
      }

      const order = await modules.orders.checkout(
        orderPayment.orderId,
        {
          paymentContext: {
            paymentIntentId: paymentIntent.id,
          },
        },
        resolvedContext,
      );

      logger.info(`checkout successful`, {
        orderPaymentId,
        orderId: order._id,
        type: event.type,
      });
      response.writeHead(200);
      response.end(
        JSON.stringify({
          message: 'checkout successful',
          orderId: order._id,
        }),
      );
    } else if (event.type === WebhookEventTypes.SETUP_INTENT_SUCCEEDED) {
      const setupIntent = event.data.object;
      const { paymentProviderId, userId } = setupIntent.metadata || {};

      logger.verbose(`registered payment credential with paymentProviderId: ${paymentProviderId}`, {
        type: event.type,
        userId,
      });

      const paymentCredentials = await modules.payment.registerCredentials(
        paymentProviderId,
        {
          transactionContext: {
            setupIntentId: setupIntent.id,
          },
          userId,
        },
        resolvedContext,
      );

      logger.info(`payment credentials registration successful`, {
        userId,
        paymentProviderId,
        paymentCredentialsId: paymentCredentials?._id,
        type: event.type,
      });
      response.writeHead(200);
      response.end(
        JSON.stringify({
          message: 'payment credentials registration successful',
          paymentCredentialsId: paymentCredentials?._id,
        }),
      );
    }
  } catch (error) {
    logger.error(error, {
      type: event.type,
    });
    response.writeHead(500);
    response.end(error.message);
  }
};
