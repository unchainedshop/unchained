import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
} from 'meteor/unchained:core-payment';

const { BRAINTREE_SANDBOX_TOKEN, BRAINTREE_PRIVATE_KEY } = process.env;

class Paypal extends PaymentAdapter {
  static key = 'com.paypal';

  static label = 'Paypal (Braintree)';

  static version = '1.0';

  static initialConfiguration = [
    {
      key: 'publicKey',
      value: null,
    },
    {
      key: 'merchantId',
      value: null,
    },
  ];

  static typeSupported(type) {
    return type === 'GENERIC';
  }

  getPublicKey() {
    return this.config.reduce((current, item) => {
      if (item.key === 'publicKey') return item.value;
      return current;
    }, null);
  }

  getMerchantId() {
    return this.config.reduce((current, item) => {
      if (item.key === 'merchantId') return item.value;
      return current;
    }, null);
  }

  getAccessToken() { // eslint-disable-line
    return BRAINTREE_SANDBOX_TOKEN;
  }

  getPrivateKey() { // eslint-disable-line
    return BRAINTREE_PRIVATE_KEY;
  }

  configurationError() {
    const publicCredentialsValid =
      this.getAccessToken() ||
      (this.getMerchantId() && this.getPublicKey() && this.getPrivateKey());

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

  gateway(braintree) {
    const accessToken = this.getAccessToken();
    if (accessToken) {
      // sandbox mode!
      return braintree.connect({
        accessToken,
      });
    }
    return braintree.connect({
      environment: braintree.Environment.Production,
      merchantId: this.getMerchantId(),
      publicKey: this.getPublicKey(),
      privateKey: this.getPrivateKey(),
    });
  }

  async sign() {
    const braintree = require('braintree'); // eslint-disable-line
    const gateway = this.gateway(braintree);
    const result = await gateway.clientToken.generate({});
    if (result.success) {
      return result.clientToken;
    }
    throw new Error('Could not retrieve the client token');
  }

  async charge({ paypalPaymentMethodNonce }) {
    if (!paypalPaymentMethodNonce)
      throw new Error(
        'You have to provide paypalPaymentMethodNonce in paymentContext'
      );
    const braintree = require('braintree'); // eslint-disable-line
    const gateway = this.gateway(braintree);
    const address = this.context.order.billingAddress || {};
    const pricing = this.context.order.pricing();
    const rounded = Math.round(pricing.total().amount / 10 || 0) * 10;
    const saleRequest = {
      amount: rounded / 100,
      merchantAccountId: this.context.order.currency,
      paymentMethodNonce: paypalPaymentMethodNonce,
      orderId: this.context.order.orderNumber || this.context.order._id,
      shipping: {
        firstName: address.firstName,
        lastName: address.lastName,
        company: address.company,
        streetAddress: address.addressLine,
        extendedAddress: address.addressLine2,
        locality: address.city,
        region: address.regionCode,
        postalCode: address.postalCode,
        countryCodeAlpha2: address.countryCode,
      },
      options: {
        submitForSettlement: true,
      },
    };
    const result = await gateway.transaction.sale(saleRequest);
    if (result.success) {
      return result;
    }
    this.log(saleRequest);
    throw new Error(result.message);
  }
}

PaymentDirector.registerAdapter(Paypal);
