import {
  registerAdapter,
  PaymentAdapter,
  PaymentError,
  paymentLogger,
} from 'meteor/unchained:core-payment';

const { BRAINTREE_SANDBOX_TOKEN, BRAINTREE_PRIVATE_KEY } = process.env;

class BraintreeDirect extends PaymentAdapter {
  static key = 'shop.unchained.braintree-direct';

  static label = 'Braintree Direct';

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

  // eslint-disable-next-line
  getAccessToken() {
    return BRAINTREE_SANDBOX_TOKEN;
  }

  // eslint-disable-next-line
  getPrivateKey() {
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

  // eslint-disable-next-line
  isPayLaterAllowed() {
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
      paymentLogger.info(`Braintree Plugin: ${result.message}`, saleRequest);
      return result;
    }
    paymentLogger.warn(`Braintree Plugin: ${result.message}`, saleRequest);
    throw new Error(result.message);
  }
}

registerAdapter(BraintreeDirect);
