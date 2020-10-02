import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
  PaymentCredentials,
} from 'meteor/unchained:core-payment';
import { createLogger } from 'meteor/unchained:core-logger';
import { WebApp } from 'meteor/webapp';
import bodyParser from 'body-parser';
import { OrderPayments } from 'meteor/unchained:core-orders';
import { Users } from 'meteor/unchained:core-users';

const {
  STRIPE_SECRET,
  STRIPE_ENDPOINT_SECRET,
  EMAIL_WEBSITE_NAME,
  STRIPE_WEBHOOK_PATH = '/graphql/stripe',
} = process.env;

/*
Test Webhooks:

brew install stripe/stripe-cli/stripe
stripe login --api-key sk_....
stripe listen --forward-to http://localhost:3000/graphql/stripe
stripe trigger payment_intent.succeeded
*/

const logger = createLogger('unchained:core-payment:stripe-webhook');

const stripe = require('stripe')(STRIPE_SECRET);

WebApp.connectHandlers.use(
  STRIPE_WEBHOOK_PATH,
  bodyParser.raw({ type: 'application/json' })
);

WebApp.connectHandlers.use(STRIPE_WEBHOOK_PATH, (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      STRIPE_ENDPOINT_SECRET
    );
  } catch (err) {
    response.writeHead(400);
    return response.end(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderPaymentId = paymentIntent.metadata?.orderPaymentId;
    const orderPayment = OrderPayments.findOne({ _id: orderPaymentId });
    const order = orderPayment.order().checkout({
      paymentContext: {
        paymentIntentId: paymentIntent.id,
      },
    });
    logger.info(
      `Stripe Webhook: Unchained confirmed checkout for order ${order.orderNumber}`,
      { orderId: order._id }
    );
  } else if (event.type === 'setup_intent.succeeded') {
    const setupIntent = event.data.object;
    const { paymentProviderId, userId } = setupIntent.metadata;
    PaymentCredentials.registerPaymentCredentials({
      paymentProviderId,
      paymentContext: {
        setupIntentId: setupIntent.id,
      },
      userId,
    });
    logger.info(
      `Datatrans Webhook: Unchained registered payment credentials for ${userId}`,
      { userId }
    );
  } else {
    response.writeHead(400);
    return response.end();
  }

  // Return a 200 response to acknowledge receipt of the event
  return response.end(JSON.stringify({ received: true }));
});

class Stripe extends PaymentAdapter {
  static key = 'shop.unchained.payment.stripe';

  static label = 'Stripe';

  static version = '2.0';

  static typeSupported(type) {
    return type === 'GENERIC';
  }

  // eslint-disable-next-line
  configurationError() {
    // eslint-disable-line
    if (!STRIPE_SECRET || !STRIPE_ENDPOINT_SECRET) {
      return PaymentError.INCOMPLETE_CONFIGURATION;
    }
    return null;
  }

  isActive() {
    if (this.configurationError() === null) return true;
    return false;
  }

  // eslint-disable-next-line
  isPayLaterAllowed() {
    return false;
  }

  // eslint-disable-next-line
  async validate(token) {
    const paymentMethod = await stripe.paymentMethods.retrieve(token);
    // TODO: Add further checks like expiration of cards
    return !!paymentMethod;
  }

  async register({ setupIntentId }) {
    if (!setupIntentId) {
      throw new Error('You have to provide a setup intent id');
    }

    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

    if (setupIntent.status === 'succeeded') {
      return {
        token: setupIntent.payment_method,
        customer: setupIntent.customer,
        payment_method_options: setupIntent.payment_method_options,
        payment_method_types: setupIntent.payment_method_types,
        usage: setupIntent.usage,
      };
    }

    this.log('Stripe -> Registration declined', setupIntentId);
    return null;
  }

  static async createRegistrationIntent(
    { userId, paymentProviderId },
    options = {}
  ) {
    const user = Users.findOne({ _id: userId });
    const customer = await stripe.customers.create({
      metadata: {
        userId,
      },
      name: user.name(),
      email: user.primaryEmail()?.address,
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
  }

  static async createOrderPaymentIntent(orderPayment, options = {}) {
    const order = orderPayment.order();
    const pricing = order.pricing();
    const reference = EMAIL_WEBSITE_NAME || order._id;
    const { currency, amount } = pricing.total();
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
  }

  async sign({ transactionContext = {} } = {}) {
    // eslint-disable-line
    const { orderPayment, userId, paymentProviderId } = this.context;
    const paymentIntent = orderPayment
      ? await this.constructor.createOrderPaymentIntent(
          orderPayment,
          transactionContext
        )
      : await this.constructor.createRegistrationIntent(
          { userId, paymentProviderId },
          transactionContext
        );
    return paymentIntent.client_secret;
  }

  async charge({ paymentIntentId, paymentCredentials }) {
    if (!paymentIntentId && !paymentCredentials) {
      throw new Error(
        'You have to provide an existing intent or a payment method'
      );
    }

    const { order } = this.context;
    const orderPayment = order.payment();
    const paymentIntentObject = paymentIntentId
      ? await stripe.paymentIntents.retrieve(paymentIntentId)
      : await this.constructor.createOrderPaymentIntent(orderPayment, {
          customer: paymentCredentials.meta?.customer,
          confirm: true,
          payment_method: paymentCredentials.token,
          payment_method_types: paymentCredentials.meta?.payment_method_types, // eslint-disable-line
          payment_method_options:
            paymentCredentials.meta?.payment_method_options, // eslint-disable-line
        });

    const { currency, amount } = order.pricing().total();
    if (
      paymentIntentObject.currency !== currency.toLowerCase() ||
      paymentIntentObject.amount !== Math.round(amount)
    ) {
      throw new Error(
        'The price has changed since you have created the intent!'
      );
    }
    if (paymentIntentObject.metadata?.orderPaymentId !== orderPayment?._id) {
      throw new Error(
        'The order payment is different from the initiating intent!'
      );
    }

    if (paymentIntentObject.status === 'succeeded') {
      return paymentIntentObject;
    }

    return false;
  }
}

PaymentDirector.registerAdapter(Stripe);
