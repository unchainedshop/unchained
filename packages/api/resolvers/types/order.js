import { Currencies } from 'meteor/unchained:core-currencies';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';

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
  status(obj) {
    return obj.normalizedStatus();
  },
  total(obj, { category }) {
    return obj.pricing().total(category);
  },
  async currency(obj) {
    return Currencies.findCurrency({ isoCode: obj.currency });
  },
  meta(obj) {
    return obj.context;
  },
  logs: checkTypeResolver(actions.viewLogs, 'logs'),
};
