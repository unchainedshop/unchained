import {
  registerAdapter,
  PaymentAdapter,
  PaymentError,
  paymentLogger,
} from 'meteor/unchained:core-payment';

const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

const {
  PAYPAL_CLIENT_ID,
  PAYPAL_SECRET,
  PAYPAL_ENVIRONMENT = 'sandbox',
} = process.env;

/**
 *
 * Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
 * This sample uses SandboxEnvironment. In production, use ProductionEnvironment.
 *
 */
function environment() {
  const clientId = PAYPAL_CLIENT_ID;
  const clientSecret = PAYPAL_SECRET;

  return PAYPAL_ENVIRONMENT !== 'live'
    ? new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret)
    : new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
}

class PaypalCheckout extends PaymentAdapter {
  static key = 'com.paypal.checkout';

  static label = 'Paypal (Checkout / Native)';

  static version = '1.0';

  static initialConfiguration = [];

  static typeSupported(type) {
    return type === 'GENERIC';
  }

  // eslint-disable-next-line
  configurationError() {
    const publicCredentialsValid = PAYPAL_CLIENT_ID && PAYPAL_SECRET;

    if (!publicCredentialsValid) {
      return PaymentError.WRONG_CREDENTIALS;
    }
    return null;
  }

  isActive() {
    if (!this.configurationError()) return true;
    return false;
  }

  // eslint-disable-next-line
  isPayLaterAllowed() {
    return false;
  }

  // eslint-disable-next-line
  async sign() {
    return PAYPAL_CLIENT_ID;
  }

  async charge({ orderID }) {
    if (!orderID) {
      paymentLogger.warn('Paypal Native Plugin: PRICE MATCH');
      throw new Error('You have to provide orderID in paymentContext');
    }

    try {
      const request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderID);
      const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment());
      const order = await client.execute(request);

      const pricing = this.context.order.pricing();
      const ourTotal = (pricing.total().amount / 100).toFixed(2);
      const paypalTotal = order.result.purchase_units[0].amount.value;

      if (ourTotal === paypalTotal) {
        paymentLogger.info('Paypal Native Plugin: PRICE MATCH');
        return order;
      }

      paymentLogger.warn(
        'Paypal Native Plugin: Missmatch PAYPAL ORDER',
        JSON.stringify(order.result, null, 2)
      );
      paymentLogger.debug('Paypal Native Plugin: OUR ORDER', this.context.order);
      paymentLogger.debug('Paypal Native Plugin: OUR PRICE', pricing);

      throw new Error(`Payment mismatch`);
    } catch (e) {
      paymentLogger.warn('Paypal Native Plugin: Failed', e);
      throw new Error(e);
    }
  }
}

registerAdapter(PaypalCheckout);
