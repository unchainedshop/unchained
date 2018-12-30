import { Currencies } from 'meteor/unchained:core-currencies';
import { actions } from '../../roles';
import { checkTypeResolver } from '../../acl';

export default {
  status(obj) {
    return obj.normalizedStatus();
  },
  total(obj, { category }) {
    return obj.pricing().total(category);
  },
  currency(obj) {
    return Currencies.findOne({ isoCode: obj.currency });
  },

  logs: checkTypeResolver(actions.viewLogs, 'logs'),
};
