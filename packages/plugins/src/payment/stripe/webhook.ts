import type { Context } from '@unchainedshop/api';
import { createLogger } from '@unchainedshop/logger';
import type { Stripe } from 'stripe';
import { stripe } from './stripe.ts';

const logger = createLogger('unchained:stripe:handler');

export const WebhookEventTypes = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  SETUP_INTENT_SUCCEEDED: 'setup_intent.succeeded',
};

export interface StripeWebhookResult {
  statusCode: number;
  body: {
    success: boolean;
    ignored?: boolean;
    name?: string;
    message?: string;
    orderId?: string;
    paymentCredentialsId?: string;
  };
}

export const handleStripeWebhook = async ({
  rawBody,
  signature,
  context,
  endpointSecret = process.env.STRIPE_ENDPOINT_SECRET,
  stripeClient = stripe,
}: {
  rawBody: string | Buffer;
  signature?: string | string[];
  context: Context;
  endpointSecret?: string;
  stripeClient?: Stripe;
}): Promise<StripeWebhookResult> => {
  const { modules, services } = context;
  let event: Stripe.Event;

  try {
    if (!endpointSecret) {
      throw new Error('env STRIPE_ENDPOINT_SECRET is required for webhook handling');
    }
    if (!signature) {
      throw new Error('stripe-signature header was not provided for webhook');
    }
    event = stripeClient.webhooks.constructEvent(rawBody, signature, endpointSecret);
  } catch (err) {
    logger.error(`Error constructing event: ${err.message}`);
    return {
      statusCode: 400,
      body: {
        success: false,
        message: err.message,
        name: err.name,
      },
    };
  }

  if (!Object.values(WebhookEventTypes).includes(event.type)) {
    logger.info(`unhandled event type`, {
      type: event.type,
    });
    return {
      statusCode: 200,
      body: {
        success: false,
        ignored: true,
        name: 'UNHANDLED_EVENT_TYPE',
        message: `Unhandled event type: ${event.type}. Supported types: ${Object.values(WebhookEventTypes).join(', ')}`,
      },
    };
  }

  const eventObject = event.data?.object as { metadata?: Record<string, string> };
  const environmentInMetadata = eventObject?.metadata?.environment || '';
  const environmentInEnv = process.env.STRIPE_WEBHOOK_ENVIRONMENT || '';
  if (environmentInMetadata !== environmentInEnv) {
    logger.info(`unhandled event environment`, {
      type: event.type,
      environment: environmentInMetadata,
    });
    return {
      statusCode: 200,
      body: {
        success: false,
        ignored: true,
        name: 'UNHANDLED_EVENT_ENVIRONMENT',
        message: `Unhandled event environment: ${environmentInMetadata}. Supported environment: ${environmentInEnv}`,
      },
    };
  }

  logger.info(`Processing event`, {
    type: event.type,
  });

  try {
    if (event.type === WebhookEventTypes.PAYMENT_INTENT_SUCCEEDED) {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
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

      return {
        statusCode: 200,
        body: {
          success: true,
          message: 'checkout successful',
          orderId: order._id,
        },
      };
    }

    if (event.type === WebhookEventTypes.SETUP_INTENT_SUCCEEDED) {
      const setupIntent = event.data.object as Stripe.SetupIntent;
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

      return {
        statusCode: 200,
        body: {
          success: true,
          message: 'payment credentials registration successful',
          paymentCredentialsId: paymentCredentials?._id,
        },
      };
    }
  } catch (error) {
    logger.error(error, {
      type: event.type,
    });
    return {
      statusCode: 500,
      body: {
        success: false,
        message: error.message,
        name: error.name,
      },
    };
  }

  return {
    statusCode: 200,
    body: {
      success: false,
      ignored: true,
      name: 'UNHANDLED_EVENT_TYPE',
      message: `Unhandled event type: ${event.type}. Supported types: ${Object.values(WebhookEventTypes).join(', ')}`,
    },
  };
};
