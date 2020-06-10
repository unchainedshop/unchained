import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
} from 'meteor/unchained:core-payment';

const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const payPalClient = require('./client');

const { PAYPAL_CLIENT_ID, PAYPAL_SECRET } = process.env;

class PaypalCheckout extends PaymentAdapter {
  static key = 'com.paypal.checkout';

  static label = 'Paypal (Checkout / Native)';

  static version = '1.0';

  static initialConfiguration = [
    {
      key: 'description',
      value: 'Paypal/Credit Card',
    },
  ];

  static typeSupported(type) {
    return type === 'GENERIC';
  }

  configurationError() { // eslint-disable-line
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

  isPayLaterAllowed() { // eslint-disable-line
    return false;
  }

  async sign() { // eslint-disable-line
    return PAYPAL_CLIENT_ID;
  }

  async charge({ orderID }) {
    if (!orderID)
      throw new Error('You have to provide orderID in paymentContext');

    try {
      const request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderID);
      const order = await payPalClient.client().execute(request);

      const pricing = this.context.order.pricing();
      const ourTotal = (pricing.total().amount / 100).toFixed(2);
      const paypalTotal = order.result.purchase_units[0].amount.value;

      if (ourTotal === paypalTotal) {
        this.log('Paypal Native -> PRICE MATCH');
        return order;
      }

      this.log(
        'Paypal Native -> PAYPAL ORDER',
        JSON.stringify(order.result, null, 2),
      );
      this.log('Paypal Native -> OUR ORDER', this.context.order);
      this.log('Paypal Native -> OUR PRICE', pricing);

      throw new Error(`Payment mismatch`);
    } catch (e) {
      this.log('Paypal Native -> Failed', e);
      throw new Error(e);
    }
  }
}

PaymentDirector.registerAdapter(PaypalCheckout);
