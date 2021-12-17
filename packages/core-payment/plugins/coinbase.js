import coinbase from 'coinbase-commerce-node';

import {
  registerAdapter,
  PaymentAdapter,
  PaymentError,
  paymentLogger,
} from 'meteor/unchained:core-payment';

import { OrderPricingSheet } from 'meteor/unchained:director-pricing';

const { COINBASE_COMMERCE_KEY } = process.env;

class Coinbase extends PaymentAdapter {
  static key = 'com.coinbase';

  static label = 'Coinbase';

  static version = '1.0';

  static initialConfiguration = [
    {
      key: 'description',
      value: 'Cryptocurrencies (Coinbase)',
    },
  ];

  static typeSupported(type) {
    return type === 'GENERIC';
  }

  // eslint-disable-next-line
  configurationError() {
    const publicCredentialsValid = !!COINBASE_COMMERCE_KEY;

    if (!publicCredentialsValid) {
      return PaymentError.WRONG_CREDENTIALS;
    }

    try {
      coinbase.Client.init(COINBASE_COMMERCE_KEY);
    } catch (e) {
      return PaymentError.INCOMPLETE_CONFIGURATION;
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

  async sign() {
    const { orderPayment } = this.context;
    const order = orderPayment.order();

    try {
      const pricing = new OrderPricingSheet({
        calculation: order.calculation,
        currency: order.currency,
      });

      const rounded = Math.round(pricing.total().amount / 10 || 0) * 10;

      const clientObj = coinbase.Client.init(COINBASE_COMMERCE_KEY);
      clientObj.setRequestTimeout(10000);

      const config = {
        name: 'Postcard',
        description: 'Handpainted by Veli & Amos and friends',
        pricing_type: 'fixed_price',
        local_price: {
          amount: `${rounded / 100}.00`,
          currency: order.currency,
        },
        requested_info: [],
      };

      const checkout = await coinbase.resources.Checkout.create(config);
      paymentLogger.info('Coinbase Plugin: Signed', checkout.id);
      return checkout.id;
    } catch (e) {
      paymentLogger.warn('Coinbase Plugin: Charge failed', e);
      throw e;
    }
  }

  // eslint-disable-next-line
  async charge(transactionResponse) {
    const { chargeCode } = transactionResponse;

    try {
      const clientObj = coinbase.Client.init(COINBASE_COMMERCE_KEY);
      clientObj.setRequestTimeout(10000);
      const charge = await coinbase.resources.Charge.retrieve(chargeCode);

      const completed = !!charge.timeline.find(
        (statusUpdate) => statusUpdate.status === 'COMPLETED'
      );

      if (completed) {
        paymentLogger.info('Coinbase Plugin: Charged successfully', charge);
        return charge;
      }
      paymentLogger.warn('Coinbase Plugin: Charge not completed', charge);
      throw new Error('Charge not completed');
    } catch (e) {
      paymentLogger.warn('Coinbase Plugin: Charge failed', e);
      throw e;
    }
  }
}

registerAdapter(Coinbase);
