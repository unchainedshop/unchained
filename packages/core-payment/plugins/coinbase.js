import coinbase from 'coinbase-commerce-node';

import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
} from 'meteor/unchained:core-payment';

import { OrderPricingSheet } from 'meteor/unchained:core-pricing';

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

  configurationError() {
    const publicCredentialsValid = !!COINBASE_COMMERCE_KEY;

    if (!publicCredentialsValid) {
      return PaymentError.WRONG_CREDENTIALS;
    }

    try {
      coinbase.Client.init(COINBASE_COMMERCE_KEY);
    } catch (e) {
      this.log(e);
      return PaymentError.INCOMPLETE_CONFIGURATION;
    }
    return null;
  }

  isActive() {
    if (!this.configurationError()) return true;
    return false;
  }

  isPayLaterAllowed() {  // eslint-disable-line
    // eslint-disable-line
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
      this.log('Coinbase -> Signed', checkout.id);
      return checkout.id;
    } catch (e) {
      this.log('Coinbase -> Charge failed', e);
      throw e;
    }
  }

  async charge(transactionResponse) {
    const { chargeCode } = transactionResponse;

    try {
      const clientObj = coinbase.Client.init(COINBASE_COMMERCE_KEY);
      clientObj.setRequestTimeout(10000);
      const charge = await coinbase.resources.Charge.retrieve(chargeCode);

      const completed = !!charge.timeline.find(
        (statusUpdate) => statusUpdate.status === 'COMPLETED',
      );

      if (completed) {
        this.log('Coinbase -> Charged successfully', charge);
        return charge;
      }
      this.log('Coinbase -> Charge not completed', charge);
      throw new Error('Charge not completed');
    } catch (e) {
      this.log('Coinbase -> Charge failed', e);
      throw e;
    }
  }
}

PaymentDirector.registerAdapter(Coinbase);
