import { createRoles, Role, type RolesInterface } from '@unchainedshop/roles';
import { all } from './all.ts';
import { loggedIn } from './loggedIn.ts';
import { admin } from './admin.ts';

const actions: Record<string, string> = [
  'impersonate',
  'stopImpersonation',
  'viewEvent',
  'viewEvents',
  'viewUserRoles',
  'viewUserOrders',
  'viewUserQuotations',
  'viewUserPublicInfos',
  'viewUserPrivateInfos',
  'viewUserEnrollments',
  'viewUserTokens',
  'viewLogs',
  'viewUser',
  'viewUsers',
  'viewUserCount',
  'viewProduct',
  'viewProducts',
  'viewLanguages',
  'viewLanguage',
  'viewCountries',
  'viewCountry',
  'viewCurrencies',
  'viewCurrency',
  'viewPaymentProviders',
  'viewPaymentProvider',
  'viewPaymentInterfaces',
  'viewDeliveryProviders',
  'viewDeliveryProvider',
  'viewDeliveryInterfaces',
  'viewWarehousingProviders',
  'viewWarehousingProvider',
  'viewWarehousingInterfaces',
  'viewTranslations',
  'viewOrders',
  'viewOrder',
  'viewShopInfo',
  'updateUser',
  'updateUsername',
  'sendEmail',
  'manageUsers',
  'enrollUser',
  'manageLanguages',
  'manageCountries',
  'manageProducts',
  'manageCurrencies',
  'managePaymentProviders',
  'manageDeliveryProviders',
  'manageWarehousingProviders',
  'updateToken',
  'viewToken',
  'viewTokens',
  'manageAssortments',
  'manageFilters',
  'createCart',
  'createEnrollment',
  'updateEnrollment',
  'updateCart',
  'checkoutCart',
  'updateOrder',
  'updateOrderDelivery',
  'updateOrderPayment',
  'updateOrderDiscount',
  'updateOrderItem',
  'markOrderConfirmed',
  'markOrderRejected',
  'markOrderPaid',
  'markOrderDelivered',
  'viewAssortments',
  'viewAssortment',
  'viewFilter',
  'viewFilters',
  'reviewProduct',
  'updateProductReview',
  'manageProductReviews',
  'voteProductReview',
  'requestQuotation',
  'viewQuotations',
  'viewQuotation',
  'manageQuotations',
  'answerQuotation',
  'bookmarkProduct',
  'manageBookmarks',
  'search',
  'manageWorker',
  'viewWorkQueue',
  'viewWork',
  'viewEnrollments',
  'viewEnrollment',
  'registerPaymentCredentials',
  'managePaymentCredentials',
  'bulkImport',
  'logout',
  'logoutAllSessions',
  'loginAsGuest',
  'loginWithPassword',
  'loginWithWebAuthn',
  'verifyEmail',
  'useWebAuthn',
  'pageView',
  'createUser',
  'forgotPassword',
  'resetPassword',
  'changePassword',
  'viewUserProductReviews',
  'heartbeat',
  'confirmMediaUpload',
  'viewStatistics',
  'removeUser',
  'downloadFile',
  'uploadUserAvatar',
  'uploadTempFile',
].reduce((oldValue, actionValue) => {
  const newValue = oldValue;
  newValue[actionValue] = actionValue;
  return newValue;
}, {});

let allRoles: Record<string, any> = {};

const configureRoles = ({
  additionalRoles,
  additionalActions,
}: {
  additionalRoles?: Record<string, any>;
  additionalActions?: string[];
}): RolesInterface => {
  const roles = createRoles();

  roles.adminRole = roles.addRole(new Role('admin'));
  roles.loggedInRole = roles.addRole(new Role('__loggedIn__'));
  roles.allRole = roles.addRole(new Role('__all__'));

  additionalActions?.forEach((action) => {
    actions[action] = action;
  });

  allRoles = {
    ADMIN: roles.adminRole,
    LOGGEDIN: roles.loggedInRole,
    ALL: roles.allRole,
  };

  Object.entries(additionalRoles || {}).forEach(([key, val]: [string, any]) => {
    allRoles[key] = roles.addRole(new Role(key));
    val(allRoles[key], actions);
  });

  all(allRoles.ALL, actions);
  loggedIn(allRoles.LOGGEDIN, actions);
  admin(allRoles.ADMIN, actions);

  return roles;
};

const getPublicRoles = (roles: RolesInterface): string[] => {
  return Object.values(roles.roles)
    .map((role) => role?.name)
    .filter(Boolean)
    .filter((name: string) => !name.startsWith('__')) as string[];
};

export { allRoles, actions, configureRoles, getPublicRoles };
