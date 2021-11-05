import crypto from 'crypto';
import { Currencies } from 'meteor/unchained:core-currencies';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { PaymentProviders } from 'meteor/unchained:core-payment';
import { logs } from '../transformations/helpers/logs';
import { actions } from '../../roles';

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

  logs: logs('orderId', actions.viewLogs),
};
