import { Currencies } from 'meteor/unchained:core-currencies';
import { actions } from '../../roles';
import { checkAction } from '../acl';

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
  logs(obj, params, context) {
    checkAction(actions.viewLogs, context.userId);
    return obj.logs(params);
  },
};
