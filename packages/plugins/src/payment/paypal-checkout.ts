import {
  OrderPricingSheet,
  type IPaymentAdapter,
  PaymentAdapter,
  PaymentDirector,
  PaymentError,
} from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:paypal-checkout');

let checkoutNodeJssdk;
try {
  // eslint-disable-next-line
  // @ts-ignore
  checkoutNodeJssdk = await import('@paypal/checkout-server-sdk');
  // TODO: npm warn deprecated @paypal/checkout-server-sdk@1.0.3: Package no longer supported. The author suggests using the @paypal/paypal-server-sdk package instead: https://www.npmjs.com/package/@paypal/paypal-server-sdk.
} catch {
  /* */
  logger.warn(
    "npm dependency '@paypal/checkout-server-sdk' is not installed, paypal adapter will not work",
  );
}

const { PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_ENVIRONMENT = 'sandbox' } = process.env;

/**
 *
 * Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
 * This sample uses SandboxEnvironment. In production, use ProductionEnvironment.
 *
 */
const environment = () => {
  const clientId = PAYPAL_CLIENT_ID;
  const clientSecret = PAYPAL_SECRET;

  return PAYPAL_ENVIRONMENT !== 'live'
    ? new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret)
    : new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
};

const roundToDecimals = (number, decimals) => {
  const num = Math.pow(10, decimals);
  return Math.round(number * num) / num;
};

const PaypalCheckout: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.payment.paypal',
  label: 'Paypal',
  version: '1.0.1',

  initialConfiguration: [],

  typeSupported: (type) => {
    return type === 'GENERIC';
  },

  actions: (config, context) => {
    const adapter = {
      ...PaymentAdapter.actions(config, context),

      configurationError: () => {
        const publicCredentialsValid = PAYPAL_CLIENT_ID && PAYPAL_SECRET;

        if (!publicCredentialsValid) {
          return PaymentError.WRONG_CREDENTIALS;
        }
        return null;
      },

      isActive: () => {
        if (adapter.configurationError() === null) return true;
        return false;
      },

      isPayLaterAllowed: () => {
        return false;
      },

      sign: async () => {
        return PAYPAL_CLIENT_ID || null;
      },

      charge: async ({ orderID }) => {
        const { order } = context;

        if (!order) throw new Error('Order missing in payment context');

        if (!orderID) {
          throw new Error('You have to provide orderID in paymentContext');
        }

        try {
          const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment());

          // Fetch the current state of the PayPal order.
          const getRequest = new checkoutNodeJssdk.orders.OrdersGetRequest(orderID);
          let paypalResult = (await client.execute(getRequest)).result;

          // If the buyer approved the order but funds were not captured yet, capture
          // them server-side now. Never trust the client to have captured: marking an
          // order PAID must require that money actually moved.
          if (paypalResult.status === 'APPROVED') {
            const captureRequest = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
            captureRequest.requestBody({});
            paypalResult = (await client.execute(captureRequest)).result;
          }

          // Only a fully captured order counts as paid. A merely CREATED/APPROVED/VOIDED
          // order means no settled funds, so it must never confirm the checkout.
          if (paypalResult.status !== 'COMPLETED') {
            throw new Error(`PayPal order not completed (status: ${paypalResult.status})`);
          }

          // Validate against the actual settled capture, not the requested unit amount.
          const capture = paypalResult.purchase_units?.[0]?.payments?.captures?.find(
            (c) => c.status === 'COMPLETED',
          );
          if (!capture) {
            throw new Error('PayPal order has no completed capture');
          }

          const pricing = OrderPricingSheet({
            calculation: order.calculation,
            currencyCode: order.currencyCode,
          });
          const ourTotal = roundToDecimals(pricing.total({ useNetPrice: false }).amount / 100, 2);
          const paidTotal = roundToDecimals(capture.amount.value, 2);

          if (ourTotal === paidTotal && capture.amount.currency_code === order.currencyCode) {
            return order;
          }

          logger.warn('Missmatch PAYPAL ORDER', JSON.stringify(paypalResult, null, 2));

          logger.debug('OUR ORDER', order);
          logger.debug('OUR PRICE', pricing);

          throw new Error(`Payment mismatch`);
        } catch (e) {
          logger.warn(e);
          throw new Error((e as Error).message, { cause: e });
        }
      },
    };
    return adapter;
  },
};

PaymentDirector.registerAdapter(PaypalCheckout);
