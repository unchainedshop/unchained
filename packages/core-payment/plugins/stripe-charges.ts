import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
  paymentLogger,
} from 'meteor/unchained:core-payment';
import bodyParser from 'body-parser';
import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import { IPaymentAdapter } from '@unchainedshop/types/payments';
import { Context } from '@unchainedshop/types/api';
import { PaymentPricingSheet } from 'src/director/PaymentPricingSheet';

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

useMiddlewareWithCurrentContext(
  STRIPE_CHARGES_WEBHOOK_PATH,
  bodyParser.raw({ type: 'application/json' })
);

useMiddlewareWithCurrentContext(
  STRIPE_CHARGES_WEBHOOK_PATH,
  async (request, response) => {
    const requestContext = request.unchainedContext as Context;
    const { modules } = requestContext;

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
        const orderPayment = await modules.orders.payments.findOrderPayment({
          orderPaymentId,
        });
        const order = await modules.orders.findOrder({
          orderId: orderPayment.orderId,
        });
        const paymentContext = {
          stripeToken: source,
        };
        if (modules.orders.isCart(order)) {
          await modules.orders.checkout(
            order,
            {
              paymentContext,
            },
            requestContext
          );
          paymentLogger.info(
            `Stripe Webhook: Unchained checked out order ${order.orderNumber}`,
            { orderId: order._id }
          );
        } else {
          await modules.orders.payments.charge(
            orderPayment._id as string,
            paymentContext,
            requestContext
          );
          paymentLogger.info(
            `Stripe Webhook: Unchained initiated payment for order ${order.orderNumber}`,
            { orderId: order._id }
          );
        }
      } else if (event.type === 'charge.succeeded') {
        const charge = event.data.object;
        // eslint-disable-next-line
        const orderPaymentId = charge.metadata?.orderPaymentId;
        const orderPayment = await modules.orders.payments.findOrderPayment({
          orderPaymentId,
        });
        const order = await modules.orders.findOrder({
          orderId: orderPayment.orderId,
        });
        await modules.orders.payments.markAsPaid(
          orderPayment,
          charge,
          requestContext.userId
        );
        paymentLogger.info(
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

const StripeCharges: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.payment.stripe-charges',
  label: 'Stripe',
  version: '1.0',
  initialConfiguration: [],

  typeSupported: (type) => {
    return type === 'GENERIC';
  },

  actions: (params) => {
    const adapter = {
      ...PaymentAdapter.actions(params),

      configurationError: async () => {
        if (!STRIPE_SECRET) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        return null;
      },

      isActive: async () => {
        if ((await adapter.configurationError()) === null) return true;
        return false;
      },

      // eslint-disable-next-line
      isPayLaterAllowed: () => {
        return false;
      },

      charge: async (
        { stripeToken, stripeCustomerId } = {
          stripeToken: undefined,
          stripeCustomerId: undefined,
        }
      ) => {
        if (!stripeToken)
          throw new Error('You have to provide stripeToken in paymentContext');

        const pricing = PaymentPricingSheet({
          calculation: params.context.orderPayment.calculation,
          currency: params.context.order.currency,
        });

        const stripeChargeReceipt = await stripe.charges.create(
          {
            amount: Math.round(pricing.total({ useNetPrice: false }).amount),
            currency: params.context.order.currency.toLowerCase(),
            description: `${EMAIL_WEBSITE_NAME} Order #${params.context.order._id}`,
            source: stripeToken.id,
            customer: stripeCustomerId,
            metadata: {
              orderPaymentId: params.context.order.paymentId,
            },
          },
          {
            idempotencyKey: params.context.order.paymentId,
          }
        );

        if (stripeChargeReceipt.status === 'succeeded') {
          paymentLogger.info(
            `Stripe Plugin: Successfully charged ${stripeToken}`,
            stripeChargeReceipt
          );
          return stripeChargeReceipt;
        }
        paymentLogger.warn(
          `Stripe Plugin: Failed Charge for ${stripeToken}`,
          stripeChargeReceipt
        );
        return false;
      },
    };
    return adapter;
  },
};

PaymentDirector.registerAdapter(StripeCharges);
