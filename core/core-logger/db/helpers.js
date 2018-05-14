import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { Logs } from './collections';

export default () => {
  const { Users } = Promise.await(import('meteor/unchained:core-users'));
  const { Orders } = Promise.await(import('meteor/unchained:core-orders'));

  Logs.helpers({
    user() {
      return Users.findOne({
        _id: this.userId,
      });
    },
    order() {
      return Orders.findOne({
        _id: this.orderId,
      });
    },
  });
};
