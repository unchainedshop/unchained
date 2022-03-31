import { Roles, Role } from 'meteor/unchained:roles';

import { all } from './all';
import { loggedIn } from './loggedIn';
import { admin } from './admin';

const roles = {
  ADMIN: Roles.adminRole,
  LOGGEDIN: Roles.loggedInRole,
  ALL: Roles.allRole,
};

const allRoles = roles;

const actions = [
  'viewEvent',
  'viewEvents',
  'viewUserRoles',
  'viewUserOrders',
  'viewUserQuotations',
  'viewUserPublicInfos',
  'viewUserPrivateInfos',
  'viewUserEnrollments',
  'viewLogs',
  'viewUser',
  'viewUsers',
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
  'sendEmail',
  'manageUsers',
  'manageUsers',
  'manageLanguages',
  'manageCountries',
  'manageProducts',
  'manageCurrencies',
  'managePaymentProviders',
  'manageDeliveryProviders',
  'manageWarehousingProviders',
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
  'viewEnrollments',
  'viewEnrollment',
  'registerPaymentCredentials',
  'managePaymentCredentials',
  'bulkImport',
  'authTwoFactor',
  'manageTwoFactor',
  'impersonate',
].reduce((oldValue, actionValue) => {
  const newValue = oldValue;
  newValue[actionValue] = actionValue;
  return newValue;
}, {});

const configureRoles = ({ additionalRoles = {}, additionalActions = [] }) => {
  additionalActions.forEach((action) => {
    actions[action] = action;
  });
  Object.entries(additionalRoles).forEach(([key, val]: [string, any]) => {
    allRoles[key] = new Role(key);
    val(allRoles[key], actions);
  });
  all(allRoles.ALL, actions);
  loggedIn(allRoles.LOGGEDIN, actions);
  admin(allRoles.ADMIN, actions);

  return allRoles;
};

const checkUserHasPermission = Roles.userHasPermission;

const updateUserRole = (context, roleName) => Roles.addUserToRoles(context, roles[roleName].name);

export { allRoles, actions, configureRoles, checkUserHasPermission, updateUserRole };
