import { Currencies } from 'meteor/unchained:core-currencies';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import crypto from 'crypto';
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
    const price = obj.pricing().total(category);
    return {
      _id: crypto
        .createHash('sha256')
        .update([obj._id, price.amount, price.currency].join(''))
        .digest('hex'),
      ...price,
    };
  },
  async currency(obj) {
    return Currencies.findCurrency({ isoCode: obj.currency });
  },
  logs: checkTypeResolver(actions.viewLogs, 'logs'),
};
