import { Currencies } from 'meteor/unchained:core-currencies';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { Subscriptions } from 'meteor/unchained:core-subscriptions';

import { actions } from '../../roles';
import { checkTypeResolver } from '../../acl';

export default {
  async supportedDeliveryProviders(obj) {
    return DeliveryProviders.findSupported({
      order: obj,
    });
  },
  async supportedPaymentProviders(obj) {
    return PaymentProviders.findSupported({
      order: obj,
    });
  },
  async subscription(obj) {
    return Subscriptions.findOne({
      _id: obj.subscriptionId,
    });
  },
  status(obj) {
    return obj.normalizedStatus();
  },
  total(obj, { category }) {
    return obj.pricing().total(category);
  },
  currency(obj) {
    return Currencies.findOne({ isoCode: obj.currency });
  },
  meta(obj) {
    return obj.context;
  },
  logs: checkTypeResolver(actions.viewLogs, 'logs'),
};
