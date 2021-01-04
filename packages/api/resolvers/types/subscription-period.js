import { Orders } from 'meteor/unchained:core-orders';

export default {
  async order(period) {
    return Orders.findOrder({ orderId: period.orderId });
  },
};
