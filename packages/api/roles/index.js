import { Roles } from 'meteor/unchained:roles';

import all from './all';
import loggedIn from './loggedIn';
import admin from './admin';

const roles = {
  ADMIN: Roles.adminRole,
  LOGGEDIN: Roles.loggedInRole,
  ALL: Roles.allRole
};

const allRoles = roles;
export default allRoles;

export const actions = [
  'viewUserRoles',
  'viewUserOrders',
  'viewUserQuotations',
  'viewUserPublicInfos',
  'viewUserPrivateInfos',
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
  'updateCart',
  'checkoutCart',
  'updateOrder',
  'updateOrderDelivery',
  'updateOrderPayment',
  'updateOrderDiscount',
  'updateOrderItem',
  'markOrderConfirmed',
  'markOrderPaid',
  'viewAssortments',
  'viewAssortment',
  'viewFilter',
  'viewFilters',
  'reviewProduct',
  'updateProductReview',
  'manageProductReviews',
  'requestQuotation',
  'viewQuotations',
  'viewQuotation',
  'manageQuotations',
  'answerQuotation',
  'bookmarkProduct',
  'manageBookmarks',
  'search'
].reduce((oldValue, actionValue) => {
  const newValue = oldValue;
  newValue[actionValue] = actionValue;
  return newValue;
}, {});

export const configureRoles = ({ additionalRoles = {} } = {}) => {
  Object.entries(additionalRoles).forEach(([key, val]) => {
    allRoles[key] = new Roles.Role(key);
    val(allRoles[key], actions);
  });
  all(roles.ALL, actions);
  loggedIn(roles.LOGGEDIN, actions);
  admin(roles.ADMIN, actions);
};

export const checkPermission = (userId, action, ...args) =>
  Roles.userHasPermission(userId, action, ...args);

export const updateUserRole = (userId, roleName) =>
  Roles.addUserToRoles(userId, roles[roleName].name);
