import { actions } from '../../roles';
import { checkAction } from '../acl';

export default {
  cart(user, options, { countryContext }) {
    return user.cart({ countryCode: countryContext });
  },
  logs(obj, params, context) {
    checkAction(actions.viewLogs, context.userId);
    return obj.logs(params);
  },
  roles(obj, params, context) {
    checkAction(actions.viewUserRoles, context.userId);
    return obj.roles;
  },
};
