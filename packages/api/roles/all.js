export default (role, actions) => {
  const isInLoginMutationResponse = (root) => {
    // eslint-disable-next-line
    if (root && root._inLoginMethodResponse) {
      return true;
    }
    return false;
  };

  role.allow(actions.viewEvent, () => false);
  role.allow(actions.viewEvents, () => false);
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
  role.allow(actions.viewOrders, () => false);
  role.allow(actions.sendEmail, () => false);
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
  role.allow(actions.createCart, () => false);
  role.allow(actions.checkoutCart, () => false);
  role.allow(actions.updateOrder, () => false);
  role.allow(actions.updateOrderDiscount, () => false);
  role.allow(actions.updateOrderItem, () => false);
  role.allow(actions.updateOrderDelivery, () => false);
  role.allow(actions.updateOrderPayment, () => false);
  role.allow(actions.markOrderConfirmed, () => false);
  role.allow(actions.markOrderPaid, () => false);
  role.allow(actions.markOrderDelivered, () => false);
  role.allow(actions.viewLogs, isInLoginMutationResponse);
  role.allow(actions.viewUserRoles, isInLoginMutationResponse);
  role.allow(actions.viewUserOrders, isInLoginMutationResponse);
  role.allow(actions.viewUserQuotations, isInLoginMutationResponse);
  role.allow(actions.viewUserPrivateInfos, isInLoginMutationResponse);
  role.allow(actions.viewUserSubscriptions, isInLoginMutationResponse);
  role.allow(actions.reviewProduct, () => false);
  role.allow(actions.updateProductReview, () => false);
  role.allow(actions.manageProductReviews, () => false);
  role.allow(actions.requestQuotation, () => false);
  role.allow(actions.viewQuotations, () => false);
  role.allow(actions.manageQuotations, () => false);
  role.allow(actions.answerQuotation, () => false);
  role.allow(actions.manageBookmarks, () => false);
  role.allow(actions.bookmarkProduct, () => false);
  role.allow(actions.voteProductReview, () => false);
  role.allow(actions.manageWorker, () => false);
  role.allow(actions.viewSubscription, () => false);
  role.allow(actions.viewSubscriptions, () => false);
  role.allow(actions.updateSubscription, () => false);
  role.allow(actions.createSubscription, () => false);
  role.allow(actions.registerPaymentCredentials, () => false);
  role.allow(actions.managePaymentCredentials, () => false);
  role.allow(actions.bulkImport, () => false);
  role.allow(actions.viewOrder, () => false);
  role.allow(actions.viewQuotation, () => false);
  role.allow(actions.viewSubscription, () => false);

  // only allow if query is not demanding for drafts
  role.allow(actions.viewProducts, (root, { includeDrafts }) => !includeDrafts);

  // public
  role.allow(actions.viewUserPublicInfos, () => true);
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
  role.allow(actions.viewTranslations, () => true);
  role.allow(actions.search, () => true);
};
