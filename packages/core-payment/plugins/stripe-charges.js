import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
} from 'meteor/unchained:core-payment';
import bodyParser from 'body-parser';
import { OrderPayments } from 'meteor/unchained:core-orders';

import logger from '../logger';

const {
  STRIPE_SECRET,
  STRIPE_CHARGES_ENDPOINT_SECRET,
  EMAIL_WEBSITE_NAME,
  STRIPE_CHARGES_WEBHOOK_PATH = '/graphql/stripe-charges',
} = process.env;

/*
Test Webhooks:

brew install stripe/stripe-cli/stripe
stripe login --api-key sk_....
stripe listen --forward-to http://localhost:3000/graphql/stripe
stripe trigger payment_intent.succeeded
*/

const stripe = require('stripe')(STRIPE_SECRET);

WebApp.connectHandlers.use(
  STRIPE_CHARGES_WEBHOOK_PATH,
  bodyParser.raw({ type: 'application/json' })
);

WebApp.connectHandlers.use(
  STRIPE_CHARGES_WEBHOOK_PATH,
  async (request, response) => {
    const sig = request.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        sig,
        STRIPE_CHARGES_ENDPOINT_SECRET
      );
    } catch (err) {
      response.writeHead(400);
      response.end(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      if (event.type === 'source.chargeable') {
        const source = event.data.object;
        // eslint-disable-next-line
      const orderPaymentId = source.metadata?.orderPaymentId;
        const orderPayment = OrderPayments.findOne({ _id: orderPaymentId });
        const order = orderPayment.order();
        const paymentContext = {
          stripeToken: source,
        };
        if (order.isCart()) {
          await order.checkout({
            paymentContext,
          });
          logger.info(
            `Stripe Webhook: Unchained checked out order ${order.orderNumber}`,
            { orderId: order._id }
          );
        } else {
          orderPayment.charge(paymentContext, order);
          logger.info(
            `Stripe Webhook: Unchained initiated payment for order ${order.orderNumber}`,
            { orderId: order._id }
          );
        }
      } else if (event.type === 'charge.succeeded') {
        const charge = event.data.object;
        // eslint-disable-next-line
      const orderPaymentId = charge.metadata?.orderPaymentId;
        const orderPayment = OrderPayments.findOne({ _id: orderPaymentId });
        const order = orderPayment.order();
        orderPayment.markPaid(charge);
        logger.info(
          `Stripe Webhook: Unchained marked payment as paid for order ${order.orderNumber}`,
          { orderId: order._id }
        );
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
  }
);

class Stripe extends PaymentAdapter {
  static key = 'shop.unchained.payment.stripe-charges';

  static label = 'Stripe';

  static version = '1.0';

  static initialConfiguration = [];

  static typeSupported(type) {
    return type === 'GENERIC';
  }

  configurationError() {
    // eslint-disable-line
    if (!STRIPE_SECRET) {
      return PaymentError.INCOMPLETE_CONFIGURATION;
    }
    if (this.wrongCredentials) {
      return PaymentError.WRONG_CREDENTIALS;
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

  async charge({ stripeToken, stripeCustomerId } = {}) {
    if (!stripeToken)
      throw new Error('You have to provide stripeToken in paymentContext');
    const pricing = this.context.order.pricing();
    const stripeChargeReceipt = await stripe.charges.create(
      {
        amount: Math.round(pricing.total().amount),
        currency: this.context.order.currency.toLowerCase(),
        description: `${EMAIL_WEBSITE_NAME} Order #${this.context.order._id}`,
        source: stripeToken.id,
        customer: stripeCustomerId,
        metadata: {
          orderPaymentId: this.context.order.paymentId,
        },
      },
      {
        idempotencyKey: this.context.order.paymentId,
      }
    );

    if (stripeChargeReceipt.status === 'succeeded') {
      logger.info(
        `Stripe Plugin: Successfully charged ${stripeToken}`,
        stripeChargeReceipt
      );
      return stripeChargeReceipt;
    }
    logger.warn(
      `Stripe Plugin: Failed Charge for ${stripeToken}`,
      stripeChargeReceipt
    );
    return false;
  }
}

PaymentDirector.registerAdapter(Stripe);
