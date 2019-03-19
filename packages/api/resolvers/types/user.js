import { actions } from '../../roles';
import { checkAction, checkTypeResolver } from '../../acl';

export default {
  _id: checkTypeResolver(actions.viewUserPublicInfos, '_id'),
  name: checkTypeResolver(actions.viewUserPublicInfos, 'name'),
  avatar: checkTypeResolver(actions.viewUserPublicInfos, 'avatar'),

  email: checkTypeResolver(actions.viewUserPrivateInfos, 'email'),
  username: checkTypeResolver(actions.viewUserPrivateInfos, 'username'),
  isEmailVerified: checkTypeResolver(
    actions.viewUserPrivateInfos,
    'isEmailVerified'
  ),
  isGuest: checkTypeResolver(actions.viewUserPrivateInfos, 'isGuest'),
  profile: checkTypeResolver(actions.viewUserPrivateInfos, 'profile'),
  language: checkTypeResolver(actions.viewUserPrivateInfos, 'language'),
  country: checkTypeResolver(actions.viewUserPrivateInfos, 'country'),
  lastBillingAddress: checkTypeResolver(
    actions.viewUserPrivateInfos,
    'lastBillingAddress'
  ),
  lastDeliveryAddress: checkTypeResolver(
    actions.viewUserPrivateInfos,
    'lastDeliveryAddress'
  ),
  emails: checkTypeResolver(actions.viewUserPrivateInfos, 'emails'),
  tags: checkTypeResolver(actions.viewUserPrivateInfos, 'tags'),

  orders: checkTypeResolver(actions.viewUserOrders, 'orders'),
  quotations: checkTypeResolver(actions.viewUserQuotations, 'quotations'),
  logs: checkTypeResolver(actions.viewLogs, 'logs'),
  roles: checkTypeResolver(actions.viewUserRoles, 'roles'),

  cart(user, params, context = {}) {
    const { countryContext, userId } = context;
    checkAction(actions.viewUserOrders, userId, [user, params, context]);
    return user.cart({ countryContext });
  }
};
