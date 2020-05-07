import { Orders } from 'meteor/unchained:core-orders';

export default {
  async order(period) {
    return Orders.findOne({ _id: period.orderId });
  },
};
