import { Context } from '@unchainedshop/types/api.js';
import { createLogger } from '@unchainedshop/logger';
import stripe from './stripe.js';

const logger = createLogger('unchained:core-payment:stripe:webhook');

const { STRIPE_ENDPOINT_SECRET, STRIPE_WEBHOOK_ENVIRONMENT } = process.env;

export const stripeHandler = async (request, response) => {
  const resolvedContext = request.unchainedContext as Context;
  const { modules } = resolvedContext;

  let event;

  try {
    const sig = request.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(request.body, sig, STRIPE_ENDPOINT_SECRET);
    logger.verbose(`received event`, {
      type: event.type,
    });
  } catch (err) {
    logger.error(`failed event validation with: ${err.message}`);
    response.writeHead(400);
    response.end(err.message);
    return;
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { orderPaymentId, environment } = paymentIntent.metadata || {};

      if ((STRIPE_WEBHOOK_ENVIRONMENT || environment) && environment !== STRIPE_WEBHOOK_ENVIRONMENT) {
        logger.verbose(`event ignored because of environment difference`, {
          type: event.type,
        });
        response.end(JSON.stringify({ received: true, ignored: true }));
        return;
      }

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
          transactionContext: {
            paymentIntentId: paymentIntent.id,
          },
          paymentContext: {
            paymentIntentId: paymentIntent.id,
          },
        },
        resolvedContext,
      );

      logger.info(`confirmed checkout for order: ${order._id}`, {
        orderId: order._id,
        type: event.type,
      });
    } else if (event.type === 'setup_intent.succeeded') {
      const setupIntent = event.data.object;
      const { paymentProviderId, userId, environment } = setupIntent.metadata || {};

      if ((STRIPE_WEBHOOK_ENVIRONMENT || environment) && environment !== STRIPE_WEBHOOK_ENVIRONMENT) {
        response.end(JSON.stringify({ received: true, ignored: true }));
        return;
      }

      logger.verbose(`registered payment credential with paymentProviderId: ${paymentProviderId}`, {
        type: event.type,
        userId,
      });

      await modules.payment.registerCredentials(
        paymentProviderId,
        {
          transactionContext: {
            setupIntentId: setupIntent.id,
          },
          userId,
        },
        resolvedContext,
      );

      logger.info(`registered payment credentials with paymentProviderId: ${paymentProviderId}`, {
        userId,
        type: event.type,
      });
    } else {
      logger.verbose(`unhandled type`, {
        type: event.type,
      });
      response.writeHead(404);
      response.end();
      return;
    }
  } catch (err) {
    logger.error(`failed with: ${err.message}`, {
      type: event.type,
    });
    response.writeHead(400);
    response.end(err.message || 'Error');
    return;
  }
  // Return a 200 response to acknowledge receipt of the event
  logger.verbose(`event processed`, {
    type: event.type,
  });
  response.end(JSON.stringify({ received: true }));
};
