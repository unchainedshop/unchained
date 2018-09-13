import { Orders } from 'meteor/unchained:core-orders';

export default (role, actions) => {
  // private
  role.allow(actions.viewUser, () => false);
  role.allow(actions.viewUsers, () => false);
  role.allow(actions.viewPaymentProviders, () => false);
  role.allow(actions.viewPaymentProvider, () => false);
  role.allow(actions.viewPaymentInterfaces, () => false);
  role.allow(actions.viewDeliveryProviders, () => false);
  role.allow(actions.viewDeliveryProvider, () => false);
  role.allow(actions.viewDeliveryInterfaces, () => false);
  role.allow(actions.viewWarehousingProviders, () => false);
  role.allow(actions.viewWarehousingProvider, () => false);
  role.allow(actions.viewWarehousingInterfaces, () => false);
  role.allow(actions.viewTranslations, () => false);
  role.allow(actions.viewOrders, () => false);
  role.allow(actions.updateUser, () => false);
  role.allow(actions.manageLanguages, () => false);
  role.allow(actions.manageCountries, () => false);
  role.allow(actions.manageProducts, () => false);
  role.allow(actions.manageCurrencies, () => false);
  role.allow(actions.managePaymentProviders, () => false);
  role.allow(actions.manageDeliveryProviders, () => false);
  role.allow(actions.manageWarehousingProviders, () => false);
  role.allow(actions.manageAssortments, () => false);
  role.allow(actions.manageFilters, () => false);
  role.allow(actions.manageUsers, () => false);
  role.allow(actions.updateCart, () => false);
  role.allow(actions.checkoutCart, () => false);
  role.allow(actions.captureOrder, () => false);
  role.allow(actions.updateOrder, () => false);
  role.allow(actions.updateOrderPayment, () => false);
  role.allow(actions.updateOrderDelivery, () => false);
  role.allow(actions.markOrderConfirmed, () => false);
  role.allow(actions.markOrderPaid, () => false);
  role.allow(actions.viewLogs, () => false);
  role.allow(actions.viewUserRoles, () => false);

  // only allow if otp is provided
  role.allow(actions.viewOrder, (root, { orderId, otp }) => (Orders.find({
    _id: orderId,
    orderNumber: otp,
  }).count() > 0));

  // only allow if query is not demanding for drafts
  role.allow(actions.viewProducts, (root, { includeDrafts }) => !includeDrafts);

  // public
  role.allow(actions.viewProduct, () => true);
  role.allow(actions.viewLanguages, () => true);
  role.allow(actions.viewLanguage, () => true);
  role.allow(actions.viewCountries, () => true);
  role.allow(actions.viewCountry, () => true);
  role.allow(actions.viewCurrencies, () => true);
  role.allow(actions.viewCurrency, () => true);
  role.allow(actions.viewShopInfo, () => true);
  role.allow(actions.viewAssortments, () => true);
  role.allow(actions.viewAssortment, () => true);
  role.allow(actions.viewFilter, () => true);
  role.allow(actions.viewFilters, () => true);
};
