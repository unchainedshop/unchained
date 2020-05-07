import { actions } from '../../roles';
import { checkAction, checkTypeResolver } from '../../acl';

export default {
  _id: checkTypeResolver(actions.viewUserPublicInfos, '_id'),
  name: checkTypeResolver(actions.viewUserPublicInfos, 'name'),
  avatar: checkTypeResolver(actions.viewUserPublicInfos, 'avatar'),
  primaryEmail: checkTypeResolver(actions.viewUserPrivateInfos, 'primaryEmail'),

  email: checkTypeResolver(actions.viewUserPrivateInfos, 'email'),
  username: checkTypeResolver(actions.viewUserPrivateInfos, 'username'),
  isEmailVerified: checkTypeResolver(
    actions.viewUserPrivateInfos,
    'isEmailVerified'
  ),
  isInitialPassword: checkTypeResolver(
    actions.viewUserPrivateInfos,
    'isInitialPassword'
  ),
  isGuest: checkTypeResolver(actions.viewUserPrivateInfos, 'isGuest'),
  profile: checkTypeResolver(actions.viewUserPrivateInfos, 'profile'),
  language: checkTypeResolver(actions.viewUserPrivateInfos, 'language'),
  country: checkTypeResolver(actions.viewUserPrivateInfos, 'country'),
  lastBillingAddress: checkTypeResolver(
    actions.viewUserPrivateInfos,
    'lastBillingAddress'
  ),
  lastContact: checkTypeResolver(actions.viewUserPrivateInfos, 'lastContact'),
  emails: checkTypeResolver(actions.viewUserPrivateInfos, 'emails'),
  tags: checkTypeResolver(actions.viewUserPrivateInfos, 'tags'),
  bookmarks: checkTypeResolver(actions.viewUserPrivateInfos, 'bookmarks'),
  paymentCredentials: checkTypeResolver(
    actions.viewUserPrivateInfos,
    'paymentCredentials'
  ),

  orders: checkTypeResolver(actions.viewUserOrders, 'orders'),
  quotations: checkTypeResolver(actions.viewUserQuotations, 'quotations'),
  logs: checkTypeResolver(actions.viewLogs, 'logs'),
  roles: checkTypeResolver(actions.viewUserRoles, 'roles'),
  subscriptions: checkTypeResolver(
    actions.viewUserSubscriptions,
    'subscriptions'
  ),

  async cart(user, params, context = {}) {
    const { countryContext, userId } = context;
    checkAction(actions.viewUserOrders, userId, [user, params, context]);
    return user.cart({ countryContext, ...params });
  },
};
