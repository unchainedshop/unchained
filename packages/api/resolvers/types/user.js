import { actions } from '../../roles';
import { checkAction, checkTypeResolver } from '../../acl';
// import { logs } from '../transformations/helpers/logs';

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
  isTwoFactorEnabled: checkTypeResolver(
    actions.viewUserPrivateInfos,
    'isTwoFactorEnabled'
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
  lastLogin: checkTypeResolver(actions.viewUserPrivateInfos, 'lastLogin'),
  emails: checkTypeResolver(actions.viewUserPrivateInfos, 'emails'),
  tags: checkTypeResolver(actions.viewUserPrivateInfos, 'tags'),

  async bookmarks(user, params, context = {}) {
    const { userId, modules } = context;
    checkAction(actions.viewUserPrivateInfos, userId, [user, params, context]);
    return modules.bookmarks.findByUserId(user._id);
  },

  paymentCredentials: checkTypeResolver(
    actions.viewUserPrivateInfos,
    'paymentCredentials'
  ),

  orders: checkTypeResolver(actions.viewUserOrders, 'orders'),
  quotations: checkTypeResolver(actions.viewUserQuotations, 'quotations'),
  roles: checkTypeResolver(actions.viewUserRoles, 'roles'),
  enrollments: checkTypeResolver(actions.viewUserEnrollments, 'enrollments'),

  async cart(user, params, context = {}) {
    const { countryContext, userId } = context;
    checkAction(actions.viewUserOrders, userId, [user, params, context]);
    return user.cart({ countryContext, ...params });
  },

  // logs: logs('userId', actions.viewLogs),
};
