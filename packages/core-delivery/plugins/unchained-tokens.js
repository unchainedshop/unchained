import {
  DeliveryAdapter,
  DeliveryDirector
} from 'meteor/unchained:core-delivery';

class TokenDistribution extends DeliveryAdapter {
  static key = 'shop.unchained.crowdfunding';

  static label = 'Token Distribution';

  static version = '1.0';

  static initialConfiguration = [];

  static typeSupported(type) {
    return type === 'SHIPPING';
  }

  isActive() { // eslint-disable-line
    return true;
  }

  configurationError() { // eslint-disable-line
    return null;
  }

  async send(transactionContext) { // eslint-disable-line
    const { order } = this.context;
    const payment = order.payment();
    const icoEnded = false;
    if (payment.status === 'PAID' && icoEnded) {
      // wait for the payment to go into "PAID" and then
      // write down the transaction to the export csv on the filesystem.
      // said export csv will later be used to initiate coin distribution
      // on ethereum. if everything is fine, this order shall be FULLFILLED from a
      // shop perspective
      return true;
    }
    return false;
  }

  async estimatedDeliveryThroughput(warehousingThroughputTime) { // eslint-disable-line
    return 0;
  }
}

DeliveryDirector.registerAdapter(TokenDistribution);
