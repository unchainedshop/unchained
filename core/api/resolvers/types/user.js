import { actions } from '../../roles';
import { checkAction } from '../acl';

export default {
  cart(user, options, { countryContext }) {
    return user.cart({ countryCode: countryContext });
  },
  logs(obj, params, { userId } = {}) {
    checkAction(actions.viewLogs, userId);
    return obj.logs(params);
  },
  roles(obj, params, { userId } = {}) {
    checkAction(actions.viewUserRoles, userId);
    return obj.roles;
  },
};
