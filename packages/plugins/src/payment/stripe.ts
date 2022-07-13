import { Context } from '@unchainedshop/types/api';
import { IPaymentAdapter } from '@unchainedshop/types/payments';
import bodyParser from 'body-parser';
import { useMiddlewareWithCurrentContext } from '@unchainedshop/api';
import { PaymentAdapter, PaymentDirector, PaymentError } from '@unchainedshop/core-payment';
import { createLogger } from '@unchainedshop/logger';

/*
Test Webhooks:

brew install stripe/stripe-cli/stripe
stripe login --api-key sk_....
stripe listen --forward-to http://localhost:3000/payment/stripe
stripe trigger payment_intent.succeeded
*/

import createStripeClient from 'stripe';

const logger = createLogger('unchained:core-payment:stripe');

const {
  STRIPE_SECRET,
  STRIPE_ENDPOINT_SECRET,
  EMAIL_WEBSITE_NAME,
  STRIPE_WEBHOOK_PATH = '/payment/stripe',
} = process.env;

const stripe = createStripeClient(STRIPE_SECRET);

export default (app) => {
  useMiddlewareWithCurrentContext(
    app,
    STRIPE_WEBHOOK_PATH,
    bodyParser.raw({ type: 'application/json' }),
  );

  useMiddlewareWithCurrentContext(app, STRIPE_WEBHOOK_PATH, async (request, response) => {
    const sig = request.headers['stripe-signature'];
    const resolvedContext = request.unchainedContext as Context;
    const { modules, services } = resolvedContext;

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, STRIPE_ENDPOINT_SECRET);
    } catch (err) {
      response.writeHead(400);
      response.end(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const orderPaymentId = paymentIntent.metadata?.orderPaymentId;

        await modules.orders.payments.logEvent(orderPaymentId, event, resolvedContext.userId);

        const orderPayment = await modules.orders.payments.findOrderPayment({
          orderPaymentId,
        });

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

        logger.info(`Stripe Webhook: Unchained confirmed checkout for order ${order.orderNumber}`, {
          orderId: order._id,
        });
      } else if (event.type === 'setup_intent.succeeded') {
        const setupIntent = event.data.object;
        const { paymentProviderId, userId } = setupIntent.metadata;

        await services.payment.registerPaymentCredentials(
          paymentProviderId,
          {
            transactionContext: {
              setupIntentId: setupIntent.id,
            },
          },
          resolvedContext,
        );

        logger.info(`Stripe Webhook: Unchained registered payment credentials for ${userId}`, {
          userId,
        });
      } else {
        response.writeHead(404);
        response.end();
        return;
      }
    } catch (err) {
      response.writeHead(400);
      response.end(`Webhook Error: ${err.message}`);
      return;
    }
    // Return a 200 response to acknowledge receipt of the event
    response.end(JSON.stringify({ received: true }));
  });
};

const createRegistrationIntent = async ({ userId, name, email, paymentProviderId }, options = {}) => {
  const customer = await stripe.customers.create({
    metadata: {
      userId,
    },
    name,
    email,
  });
  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    metadata: {
      userId,
      paymentProviderId,
    },
    ...options,
  });
  return setupIntent;
};

const createOrderPaymentIntent = async ({ order, orderPayment, pricing }, options = {}) => {
  const reference = EMAIL_WEBSITE_NAME || order._id;
  const { currency, amount } = pricing.total({ useNetPrice: false });
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount),
    currency: currency.toLowerCase(),
    description: `${reference} #${order.orderNumber}`,
    statement_descriptor: order.orderNumber,
    statement_descriptor_suffix: reference,
    receipt_email: order.contact?.emailAddress,
    setup_future_usage: 'off_session', // Verify your integration in this guide by including this parameter
    metadata: {
      orderPaymentId: orderPayment._id,
    },
    ...options,
  });
  return paymentIntent;
};

const Stripe: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.payment.stripe',
  label: 'Stripe',
  version: '2.0',

  typeSupported(type) {
    return type === 'GENERIC';
  },

  actions: (params) => {
    const { modules } = params.context;

    const adapterActions = {
      ...PaymentAdapter.actions(params),

      // eslint-disable-next-line
      configurationError() {
        // eslint-disable-line
        if (!STRIPE_SECRET || !STRIPE_ENDPOINT_SECRET) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        return null;
      },

      isActive: () => {
        if (adapterActions.configurationError() === null) return true;
        return false;
      },

      isPayLaterAllowed() {
        return false;
      },

      validate: async ({ token }) => {
        const paymentMethod = await stripe.paymentMethods.retrieve(token);
        // TODO: Add further checks like expiration of cards
        return !!paymentMethod;
      },

      register: async ({ setupIntentId }) => {
        if (!setupIntentId) {
          throw new Error('You have to provide a setup intent id');
        }

        const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

        if (setupIntent.status === 'succeeded') {
          return {
            token: setupIntent.payment_method,
            customer: setupIntent.customer,
            // payment_method_options: setupIntent.payment_method_options,
            payment_method_types: setupIntent.payment_method_types,
            usage: setupIntent.usage,
          };
        }

        logger.warn('Stripe Plugin: Registration declined', setupIntentId);
        return null;
      },

      sign: async (transactionContext = {}) => {
        // eslint-disable-line
        const { orderPayment, paymentProviderId } = params.paymentContext;
        const { userId } = params.context;

        if (orderPayment) {
          const order = await modules.orders.findOrder({ orderId: orderPayment.orderId });
          const pricing = await modules.orders.pricingSheet(order);
          const paymentIntent = await createOrderPaymentIntent(
            { order, orderPayment, pricing },
            transactionContext,
          );
          return paymentIntent.client_secret;
        }

        const user = await modules.users.findUserById(userId);
        const email = modules.users.primaryEmail(user)?.address;
        const name = user.profile.displayName || user.username || email;

        const paymentIntent = await createRegistrationIntent(
          { userId, name, email, paymentProviderId },
          transactionContext,
        );
        return paymentIntent.client_secret;
      },

      charge: async ({ paymentIntentId, paymentCredentials }) => {
        if (!paymentIntentId && !paymentCredentials) {
          throw new Error('You have to provide an existing intent or a payment method');
        }

        const { order } = params.paymentContext;
        const orderPayment = await modules.orders.payments.findOrderPayment({
          orderPaymentId: order.paymentId,
        });

        const pricing = await modules.orders.pricingSheet(order);

        const paymentIntentObject = paymentIntentId
          ? await stripe.paymentIntents.retrieve(paymentIntentId)
          : await createOrderPaymentIntent(
              { orderPayment, order, pricing },
              {
                customer: paymentCredentials.meta?.customer,
                confirm: true,
                payment_method: paymentCredentials.token,
                payment_method_types: paymentCredentials.meta?.payment_method_types, // eslint-disable-line
                // payment_method_options: paymentCredentials.meta?.payment_method_options, // eslint-disable-line
              },
            );

        const { currency, amount } = pricing.total({ useNetPrice: false });

        if (
          paymentIntentObject.currency !== currency.toLowerCase() ||
          paymentIntentObject.amount !== Math.round(amount)
        ) {
          throw new Error('The price has changed since you have created the intent!');
        }
        if (paymentIntentObject.metadata?.orderPaymentId !== orderPayment?._id) {
          throw new Error('The order payment is different from the initiating intent!');
        }

        if (paymentIntentObject.status === 'succeeded') {
          return paymentIntentObject;
        }

        return false;
      },
    };

    return adapterActions;
  },
};

PaymentDirector.registerAdapter(Stripe);
