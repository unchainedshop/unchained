import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
} from 'meteor/unchained:core-payment';

const { STRIPE_SECRET, EMAIL_WEBSITE_NAME } = process.env;

class Stripe extends PaymentAdapter {
  static key = 'com.stripe';

  static label = 'Stripe';

  static version = '1.0';

  static initialConfiguration = [
    {
      key: 'publishableAPIKey',
      value: null,
    },
  ];

  static typeSupported(type) {
    return type === 'CARD';
  }

  getPublishableApiKey() {
    return this.config.reduce((current, item) => {
      if (item.key === 'publishableAPIKey') return item.value;
      return current;
    }, null);
  }

  configurationError() { // eslint-disable-line
    if (!this.getPublishableApiKey() || !STRIPE_SECRET) {
      return PaymentError.INCOMPLETE_CONFIGURATION;
    }
    if (this.wrongCredentials) {
      return PaymentError.WRONG_CREDENTIALS;
    }
    return null;
  }

  isActive() { // eslint-disable-line
    if (this.configurationError() === null) return true;
    return false;
  }

  isPayLaterAllowed() { // eslint-disable-line
    return false;
  }

  async charge({ stripeToken, stripeCustomerId } = {}) {
    if (!stripeToken)
      throw new Error('You have to provide stripeToken in paymentContext');
    const StripeAPI = require('stripe'); // eslint-disable-line
    const stripe = StripeAPI(STRIPE_SECRET);
    const pricing = this.context.order.pricing();
    const stripeChargeReceipt = await stripe.charges.create({
      amount: Math.round(pricing.total().amount),
      currency: this.context.order.currency.toLowerCase(),
      description: `${EMAIL_WEBSITE_NAME} Order #${this.context.order._id}`,
      source: stripeToken.id,
      customer: stripeCustomerId,
    });
    this.log('Stripe -> ', stripeToken, stripeChargeReceipt);
    return stripeChargeReceipt;
  }
}

PaymentDirector.registerAdapter(Stripe);
