import {
  OrderPricingSheet,
  IPaymentAdapter,
  PaymentAdapter,
  PaymentDirector,
  PaymentError,
} from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';

let checkoutNodeJssdk;
try {
  // eslint-disable-next-line
  // @ts-ignore
  checkoutNodeJssdk = await import('@paypal/checkout-server-sdk');
  // TODO: npm warn deprecated @paypal/checkout-server-sdk@1.0.3: Package no longer supported. The author suggests using the @paypal/paypal-server-sdk package instead: https://www.npmjs.com/package/@paypal/paypal-server-sdk. Contact Support at https://www.npmjs.com/support for more info.
} catch {
  /* */
}

const logger = createLogger('unchained:paypal-checkout');

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
          const request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderID);
          const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment());
          const paypalOrder = await client.execute(request);

          const pricing = OrderPricingSheet({
            calculation: order.calculation,
            currencyCode: order.currencyCode,
          });
          const ourTotal = (pricing.total({ useNetPrice: false }).amount / 100).toFixed(2);
          const paypalTotal = paypalOrder.result.purchase_units[0].amount.value;

          if (ourTotal === paypalTotal) {
            return order;
          }

          logger.warn('Missmatch PAYPAL ORDER', JSON.stringify(paypalOrder.result, null, 2));

          logger.debug('OUR ORDER', order);
          logger.debug('OUR PRICE', pricing);

          throw new Error(`Payment mismatch`);
        } catch (e) {
          logger.warn(e);
          throw new Error(e);
        }
      },
    };
    return adapter;
  },
};

PaymentDirector.registerAdapter(PaypalCheckout);
