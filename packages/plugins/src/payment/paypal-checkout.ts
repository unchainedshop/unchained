import { IPaymentAdapter } from '@unchainedshop/types/payments.js';
import { PaymentDirector, PaymentAdapter, PaymentError } from '@unchainedshop/core-payment';
import { createLogger } from '@unchainedshop/logger';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

const logger = createLogger('unchained:core-payment');

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

  key: 'com.paypal.checkout',
  label: 'Paypal',
  version: '1.0.0',

  initialConfiguration: [],

  typeSupported: (type) => {
    return type === 'GENERIC';
  },

  actions: (params) => {
    const adapter = {
      ...PaymentAdapter.actions(params),

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
        return PAYPAL_CLIENT_ID;
      },

      charge: async ({ orderID }) => {
        const { modules } = params.context;
        const { order } = params.paymentContext;

        if (!orderID) {
          logger.warn('Paypal Native Plugin: PRICE MATCH');
          throw new Error('You have to provide orderID in paymentContext');
        }

        try {
          const request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderID);
          const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment());
          const paypalOrder = await client.execute(request);

          const pricing = modules.orders.pricingSheet(order);
          const ourTotal = (pricing.total({ useNetPrice: false }).amount / 100).toFixed(2);
          const paypalTotal = paypalOrder.result.purchase_units[0].amount.value;

          if (ourTotal === paypalTotal) {
            logger.info('Paypal Native Plugin: PRICE MATCH');
            return order;
          }

          logger.warn(
            'Paypal Native Plugin: Missmatch PAYPAL ORDER',
            JSON.stringify(paypalOrder.result, null, 2),
          );

          logger.debug('Paypal Native Plugin: OUR ORDER', order);
          logger.debug('Paypal Native Plugin: OUR PRICE', pricing);

          throw new Error(`Payment mismatch`);
        } catch (e) {
          logger.warn('Paypal Native Plugin: Failed', e);
          throw new Error(e);
        }
      },
    };
    return adapter;
  },
};

PaymentDirector.registerAdapter(PaypalCheckout);
