import { Context } from '@unchainedshop/api';
import { createLogger } from '@unchainedshop/logger';
import stripeClient from './stripe.js';

const logger = createLogger('unchained:core-payment:stripe:handler');

export const WebhookEventTypes = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  SETUP_INTENT_SUCCEEDED: 'setup_intent.succeeded',
};

export const stripeHandler = async (request, response) => {
  const resolvedContext = request.unchainedContext as Context;
  const { modules, services } = resolvedContext;

  let event;

  try {
    const stripe = stripeClient();
    const sig = request.headers['stripe-signature'];
    if (!sig) {
      throw new Error('stripe-signature header was not provided for webhook');
    }
    if (!process.env.STRIPE_ENDPOINT_SECRET) {
      throw new Error('env STRIPE_ENDPOINT_SECRET is required for webhook handling');
    }
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_ENDPOINT_SECRET);
  } catch (err) {
    logger.error(`Error constructing event: ${err.message}`);
    response.status(400).send({
      message: err.message,
      name: err.name,
    });
    return;
  }

  if (!Object.values(WebhookEventTypes).includes(event.type)) {
    logger.info(`unhandled event type`, {
      type: event.type,
    });
    response.status(200).send({
      ignored: true,
      message: `Unhandled event type: ${event.type}. Supported types: ${Object.values(WebhookEventTypes).join(', ')}`,
    });
    return;
  }

  const environmentInMetadata = event.data?.object?.metadata?.environment || '';
  const environmentInEnv = process.env.STRIPE_WEBHOOK_ENVIRONMENT || '';
  if (environmentInMetadata !== environmentInEnv) {
    logger.info(`unhandled event environment`, {
      type: event.type,
      environment: environmentInMetadata,
    });
    response.status(200).send({
      ignored: true,
      message: `Unhandled event environment: ${environmentInMetadata}. Supported environment: ${environmentInEnv}`,
    });
    return;
  }

  logger.info(`Processing event`, {
    type: event.type,
  });
  try {
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

      logger.info(`checkout successful`, {
        orderPaymentId,
        orderId: order._id,
        type: event.type,
      });
      response.status(200).send({
        message: 'checkout successful',
        orderId: order._id,
      });
    } else if (event.type === WebhookEventTypes.SETUP_INTENT_SUCCEEDED) {
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
      response.status(200).send({
        message: 'payment credentials registration successful',
        paymentCredentialsId: paymentCredentials?._id,
      });
    }
  } catch (error) {
    logger.error(error, {
      type: event.type,
    });
    response.status(500).send({
      message: error.message,
      name: error.name,
    });
  }
};
