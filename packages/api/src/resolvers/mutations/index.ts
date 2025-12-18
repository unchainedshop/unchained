import { actions } from '../../roles/index.ts';
import { checkResolver as acl } from '../../acl.ts';
import loginWithPassword from './accounts/loginWithPassword.ts';
import loginWithWebAuthn from './accounts/loginWithWebAuthn.ts';
import loginAsGuest from './accounts/loginAsGuest.ts';
import logout from './accounts/logout.ts';
import impersonate from './accounts/impersonate.ts';
import stopImpersonation from './accounts/stopImpersonation.ts';
import changePassword from './accounts/changePassword.ts';
import createUser from './accounts/createUser.ts';
import verifyEmail from './accounts/verifyEmail.ts';
import sendVerificationEmail from './accounts/sendVerificationEmail.ts';
import sendEnrollmentEmail from './accounts/sendEnrollmentEmail.ts';
import forgotPassword from './accounts/forgotPassword.ts';
import resetPassword from './accounts/resetPassword.ts';
import addEmail from './accounts/addEmail.ts';
import removeEmail from './accounts/removeEmail.ts';
import createWebAuthnCredentialCreationOptions from './accounts/createWebAuthnCredentialCreationOptions.ts';
import createWebAuthnCredentialRequestOptions from './accounts/createWebAuthnCredentialRequestOptions.ts';
import addWebAuthnCredentials from './accounts/addWebAuthnCredentials.ts';
import removeWebAuthnCredentials from './accounts/removeWebAuthnCredentials.ts';
import addWeb3Address from './accounts/addWeb3Address.ts';
import removeWeb3Address from './accounts/removeWeb3Address.ts';
import verifyWeb3Address from './accounts/verifyWeb3Address.ts';
import updateUserProfile from './users/updateUserProfile.ts';
import removeUser from './users/removeUser.ts';
import setUserTags from './users/setUserTags.ts';
import createLanguage from './languages/createLanguage.ts';
import updateLanguage from './languages/updateLanguage.ts';
import removeLanguage from './languages/removeLanguage.ts';
import createCountry from './countries/createCountry.ts';
import updateCountry from './countries/updateCountry.ts';
import removeCountry from './countries/removeCountry.ts';
import createCurrency from './currencies/createCurrency.ts';
import updateCurrency from './currencies/updateCurrency.ts';
import removeCurrency from './currencies/removeCurrency.ts';
import createProduct from './products/createProduct.ts';
import publishProduct from './products/publishProduct.ts';
import removeProduct from './products/removeProduct.ts';
import unpublishProduct from './products/unpublishProduct.ts';
import updateProduct from './products/updateProduct.ts';
import updateProductTexts from './products/updateProductTexts.ts';
import updateProductTokenization from './products/updateProductTokenization.ts';
import updateProductMediaTexts from './products/updateProductMediaTexts.ts';
import createProductVariation from './products/createProductVariation.ts';
import createProductBundleItem from './products/createProductBundleItem.ts';
import removeBundleItem from './products/removeBundleItem.ts';
import createProductVariationOption from './products/createProductVariationOption.ts';
import removeProductVariation from './products/removeProductVariation.ts';
import updateProductVariationTexts from './products/updateProductVariationTexts.ts';
import removeProductVariationOption from './products/removeProductVariationOption.ts';
import confirmMediaUpload from './files/confirmMediaUpload.ts';
import removeProductMedia from './products/removeProductMedia.ts';
import reorderProductMedia from './products/reorderProductMedia.ts';
import updateProductCommerce from './products/updateProductCommerce.ts';
import updateProductWarehousing from './products/updateProductWarehousing.ts';
import updateProductSupply from './products/updateProductSupply.ts';
import updateProductPlan from './products/updateProductPlan.ts';
import addProductAssignment from './products/addProductAssignment.ts';
import removeProductAssignment from './products/removeProductAssignment.ts';
import createCart from './orders/createCart.ts';
import addCartProduct from './orders/addCartProduct.ts';
import addMultipleCartProducts from './orders/addMultipleCartProducts.ts';
import addCartDiscount from './orders/addCartDiscount.ts';
import addCartQuotation from './orders/addCartQuotation.ts';
import updateCart from './orders/updateCart.ts';
import emptyCart from './orders/emptyCart.ts';
import updateCartItem from './orders/updateCartItem.ts';
import removeCartItem from './orders/removeCartItem.ts';
import removeCartDiscount from './orders/removeCartDiscount.ts';
import removeOrder from './orders/removeOrder.ts';
import setOrderPaymentProvider from './orders/setOrderPaymentProvider.ts';
import setOrderDeliveryProvider from './orders/setOrderDeliveryProvider.ts';
import confirmOrder from './orders/confirmOrder.ts';
import payOrder from './orders/payOrder.ts';
import deliverOrder from './orders/deliverOrder.ts';
import createPaymentProvider from './payment/createPaymentProvider.ts';
import updatePaymentProvider from './payment/updatePaymentProvider.ts';
import removePaymentProvider from './payment/removePaymentProvider.ts';
import createDeliveryProvider from './delivery/createDeliveryProvider.ts';
import updateDeliveryProvider from './delivery/updateDeliveryProvider.ts';
import removeDeliveryProvider from './delivery/removeDeliveryProvider.ts';
import createWarehousingProvider from './warehousing/createWarehousingProvider.ts';
import updateWarehousingProvider from './warehousing/updateWarehousingProvider.ts';
import removeWarehousingProvider from './warehousing/removeWarehousingProvider.ts';
import exportToken from './warehousing/exportToken.ts';
import invalidateToken from './warehousing/invalidateToken.ts';
import setPassword from './accounts/setPassword.ts';
import setRoles from './users/setRoles.ts';
import setUsername from './accounts/setUsername.ts';
import enrollUser from './accounts/enrollUser.ts';
import checkoutCart from './orders/checkoutCart.ts';
import createFilter from './filters/createFilter.ts';
import updateFilter from './filters/updateFilter.ts';
import createFilterOption from './filters/createFilterOption.ts';
import removeFilter from './filters/removeFilter.ts';
import updateFilterTexts from './filters/updateFilterTexts.ts';
import removeFilterOption from './filters/removeFilterOption.ts';
import createAssortment from './assortments/createAssortment.ts';
import updateAssortment from './assortments/updateAssortment.ts';
import removeAssortment from './assortments/removeAssortment.ts';
import updateAssortmentTexts from './assortments/updateAssortmentTexts.ts';
import addAssortmentProduct from './assortments/addAssortmentProduct.ts';
import removeAssortmentProduct from './assortments/removeAssortmentProduct.ts';
import reorderAssortmentProducts from './assortments/reorderAssortmentProducts.ts';
import addAssortmentLink from './assortments/addAssortmentLink.ts';
import removeAssortmentLink from './assortments/removeAssortmentLink.ts';
import reorderAssortmentLinks from './assortments/reorderAssortmentLinks.ts';
import addAssortmentFilter from './assortments/addAssortmentFilter.ts';
import removeAssortmentFilter from './assortments/removeAssortmentFilter.ts';
import reorderAssortmentFilters from './assortments/reorderAssortmentFilters.ts';
import createProductReview from './products/createProductReview.ts';
import updateProductReview from './products/updateProductReview.ts';
import removeProductReview from './products/removeProductReview.ts';
import addProductReviewVote from './products/addProductReviewVote.ts';
import removeProductReviewVote from './products/removeProductReviewVote.ts';
import requestQuotation from './quotations/requestQuotation.ts';
import rejectQuotation from './quotations/rejectQuotation.ts';
import verifyQuotation from './quotations/verifyQuotation.ts';
import makeQuotationProposal from './quotations/makeQuotationProposal.ts';
import bookmark from './bookmarks/bookmark.ts';
import createBookmark from './bookmarks/createBookmark.ts';
import removeBookmark from './bookmarks/removeBookmark.ts';
import addWork from './worker/addWork.ts';
import allocateWork from './worker/allocateWork.ts';
import finishWork from './worker/finishWork.ts';
import processNextWork from './worker/processNextWork.ts';
import removeWork from './worker/removeWork.ts';
import heartbeat from './users/heartbeat.ts';
import createEnrollment from './enrollments/createEnrollment.ts';
import terminateEnrollment from './enrollments/terminateEnrollment.ts';
import activateEnrollment from './enrollments/activateEnrollment.ts';
import updateEnrollment from './enrollments/updateEnrollment.ts';
import registerPaymentCredentials from './payment/registerPaymentCredentials.ts';
import markPaymentCredentialsPreferred from './payment/markPaymentCredentialsPreferred.ts';
import removePaymentCredentials from './payment/removePaymentCredentials.ts';
import updateOrderDeliveryShipping from './orders/updateOrderDeliveryShipping.ts';
import updateOrderDeliveryPickUp from './orders/updateOrderDeliveryPickUp.ts';
import updateOrderPaymentGeneric from './orders/updateOrderPaymentGeneric.ts';
import updateOrderPaymentInvoice from './orders/updateOrderPaymentInvoice.ts';
import signPaymentProviderForCredentialRegistration from './payment/signPaymentProviderForCredentialRegistration.ts';
import signPaymentProviderForCheckout from './orders/signPaymentProviderForCheckout.ts';
import pageView from './pageView.ts';
import reorderAssortmentMedia from './assortments/reorderAssortmentMedia.ts';
import removeAssortmentMedia from './assortments/removeAssortmentMedia.ts';
import updateAssortmentMediaTexts from './assortments/updateAssortmentMediaTexts.ts';
import prepareProductMediaUpload from './products/prepareProductMediaUpload.ts';
import prepareAssortmentMediaUpload from './assortments/prepareAssortmentMediaUpload.ts';
import prepareUserAvatarUpload from './users/prepareUserAvatarUpload.ts';
import rejectOrder from './orders/rejectOrder.ts';
import removePushSubscription from './users/removePushSubscription.ts';
import addPushSubscription from './users/addPushSubscription.ts';
import removeUserProductReviews from './users/removeUserProductReviews.ts';
import updateCartDeliveryPickUp from './orders/updateCartDeliveryPickUp.ts';
import updateCartDeliveryShipping from './orders/updateCartDeliveryShipping.ts';
import updateCartPaymentGeneric from './orders/updateCartPaymentGeneric.ts';
import updateCartPaymentInvoice from './orders/updateCartPaymentInvoice.ts';

export default {
  logout: acl(actions.logout)(logout),
  loginAsGuest: acl(actions.loginAsGuest)(loginAsGuest),
  impersonate: acl(actions.impersonate)(impersonate),
  stopImpersonation: acl(actions.stopImpersonation)(stopImpersonation),

  createWebAuthnCredentialCreationOptions: acl(actions.useWebAuthn)(
    createWebAuthnCredentialCreationOptions,
  ),
  createWebAuthnCredentialRequestOptions: acl(actions.useWebAuthn)(
    createWebAuthnCredentialRequestOptions,
  ),
  addPushSubscription: acl(actions.updateUser)(addPushSubscription),
  removePushSubscription: acl(actions.updateUser)(removePushSubscription),
  addWebAuthnCredentials: acl(actions.updateUser)(addWebAuthnCredentials),
  removeWebAuthnCredentials: acl(actions.updateUser)(removeWebAuthnCredentials),
  addWeb3Address: acl(actions.updateUser)(addWeb3Address),
  removeWeb3Address: acl(actions.updateUser)(removeWeb3Address),
  verifyWeb3Address: acl(actions.updateUser)(verifyWeb3Address),
  verifyEmail: acl(actions.verifyEmail)(verifyEmail),
  loginWithPassword: acl(actions.loginWithPassword)(loginWithPassword),
  loginWithWebAuthn: acl(actions.loginWithWebAuthn)(loginWithWebAuthn),
  pageView: acl(actions.pageView)(pageView),
  createUser: acl(actions.createUser)(createUser),
  forgotPassword: acl(actions.forgotPassword)(forgotPassword),
  resetPassword: acl(actions.resetPassword)(resetPassword),
  sendVerificationEmail: acl(actions.sendEmail)(sendVerificationEmail),
  sendEnrollmentEmail: acl(actions.sendEmail)(sendEnrollmentEmail),
  changePassword: acl(actions.changePassword)(changePassword),
  heartbeat: acl(actions.heartbeat)(heartbeat),
  addEmail: acl(actions.updateUser)(addEmail),
  removeEmail: acl(actions.updateUser)(removeEmail),
  updateUserProfile: acl(actions.updateUser)(updateUserProfile),
  removeUser: acl(actions.updateUser)(removeUser),
  setPassword: acl(actions.updateUser)(setPassword),
  prepareUserAvatarUpload: acl(actions.uploadUserAvatar)(prepareUserAvatarUpload),
  setUserTags: acl(actions.manageUsers)(setUserTags),
  setUsername: acl(actions.updateUsername)(setUsername),
  setRoles: acl(actions.manageUsers)(setRoles),
  enrollUser: acl(actions.enrollUser)(enrollUser),
  registerPaymentCredentials: acl(actions.registerPaymentCredentials)(registerPaymentCredentials),
  markPaymentCredentialsPreferred: acl(actions.managePaymentCredentials)(
    markPaymentCredentialsPreferred,
  ),
  removePaymentCredentials: acl(actions.managePaymentCredentials)(removePaymentCredentials),
  createLanguage: acl(actions.manageLanguages)(createLanguage),
  updateLanguage: acl(actions.manageLanguages)(updateLanguage),
  removeLanguage: acl(actions.manageLanguages)(removeLanguage),
  createCountry: acl(actions.manageCountries)(createCountry),
  updateCountry: acl(actions.manageCountries)(updateCountry),
  removeCountry: acl(actions.manageCountries)(removeCountry),
  createProduct: acl(actions.manageProducts)(createProduct),
  publishProduct: acl(actions.manageProducts)(publishProduct),
  unpublishProduct: acl(actions.manageProducts)(unpublishProduct),
  removeProduct: acl(actions.manageProducts)(removeProduct),
  updateProduct: acl(actions.manageProducts)(updateProduct),
  updateProductTexts: acl(actions.manageProducts)(updateProductTexts),
  updateProductMediaTexts: acl(actions.manageProducts)(updateProductMediaTexts),
  confirmMediaUpload: acl(actions.confirmMediaUpload)(confirmMediaUpload),
  prepareProductMediaUpload: acl(actions.manageProducts)(prepareProductMediaUpload),
  reorderProductMedia: acl(actions.manageProducts)(reorderProductMedia),
  removeProductMedia: acl(actions.manageProducts)(removeProductMedia),
  updateProductCommerce: acl(actions.manageProducts)(updateProductCommerce),
  updateProductWarehousing: acl(actions.manageProducts)(updateProductWarehousing),
  updateProductSupply: acl(actions.manageProducts)(updateProductSupply),
  updateProductPlan: acl(actions.manageProducts)(updateProductPlan),
  updateProductTokenization: acl(actions.manageProducts)(updateProductTokenization),
  removeProductVariation: acl(actions.manageProducts)(removeProductVariation),
  updateProductVariationTexts: acl(actions.manageProducts)(updateProductVariationTexts),
  removeProductVariationOption: acl(actions.manageProducts)(removeProductVariationOption),
  createProductVariation: acl(actions.manageProducts)(createProductVariation),
  createProductBundleItem: acl(actions.manageProducts)(createProductBundleItem),
  removeBundleItem: acl(actions.manageProducts)(removeBundleItem),
  createProductVariationOption: acl(actions.manageProducts)(createProductVariationOption),
  addProductAssignment: acl(actions.manageProducts)(addProductAssignment),
  removeProductAssignment: acl(actions.manageProducts)(removeProductAssignment),
  createCurrency: acl(actions.manageCurrencies)(createCurrency),
  updateCurrency: acl(actions.manageCurrencies)(updateCurrency),
  removeCurrency: acl(actions.manageCurrencies)(removeCurrency),
  createCart: acl(actions.createCart)(createCart),
  addCartProduct: acl(actions.updateCart)(addCartProduct),
  addMultipleCartProducts: acl(actions.updateCart)(addMultipleCartProducts),
  addCartDiscount: acl(actions.updateCart)(addCartDiscount),
  addCartQuotation: acl(actions.updateCart)(addCartQuotation),
  updateCart: acl(actions.updateCart)(updateCart),
  emptyCart: acl(actions.updateCart)(emptyCart),
  checkoutCart: acl(actions.checkoutCart)(checkoutCart),
  updateCartItem: acl(actions.updateOrderItem)(updateCartItem),
  removeCartItem: acl(actions.updateOrderItem)(removeCartItem),
  removeCartDiscount: acl(actions.updateOrderDiscount)(removeCartDiscount),
  updateCartDeliveryPickUp: acl(actions.updateCart)(updateCartDeliveryPickUp),
  updateCartDeliveryShipping: acl(actions.updateCart)(updateCartDeliveryShipping),
  updateCartPaymentGeneric: acl(actions.updateCart)(updateCartPaymentGeneric),
  updateCartPaymentInvoice: acl(actions.updateCart)(updateCartPaymentInvoice),
  setOrderPaymentProvider: acl(actions.updateOrder)(setOrderPaymentProvider),
  setOrderDeliveryProvider: acl(actions.updateOrder)(setOrderDeliveryProvider),
  updateOrderDeliveryShipping: acl(actions.updateOrderDelivery)(updateOrderDeliveryShipping),
  updateOrderDeliveryPickUp: acl(actions.updateOrderDelivery)(updateOrderDeliveryPickUp),
  updateOrderPaymentGeneric: acl(actions.updateOrderPayment)(updateOrderPaymentGeneric),
  updateOrderPaymentInvoice: acl(actions.updateOrderPayment)(updateOrderPaymentInvoice),
  removeOrder: acl(actions.updateOrder)(removeOrder),
  confirmOrder: acl(actions.markOrderConfirmed)(confirmOrder),
  rejectOrder: acl(actions.markOrderRejected)(rejectOrder),
  payOrder: acl(actions.markOrderPaid)(payOrder),
  deliverOrder: acl(actions.markOrderDelivered)(deliverOrder),
  createEnrollment: acl(actions.createEnrollment)(createEnrollment),
  terminateEnrollment: acl(actions.updateEnrollment)(terminateEnrollment),
  activateEnrollment: acl(actions.updateEnrollment)(activateEnrollment),
  updateEnrollment: acl(actions.updateEnrollment)(updateEnrollment),
  createPaymentProvider: acl(actions.managePaymentProviders)(createPaymentProvider),
  updatePaymentProvider: acl(actions.managePaymentProviders)(updatePaymentProvider),
  removePaymentProvider: acl(actions.managePaymentProviders)(removePaymentProvider),
  createDeliveryProvider: acl(actions.manageDeliveryProviders)(createDeliveryProvider),
  updateDeliveryProvider: acl(actions.manageDeliveryProviders)(updateDeliveryProvider),
  removeDeliveryProvider: acl(actions.manageDeliveryProviders)(removeDeliveryProvider),
  createWarehousingProvider: acl(actions.manageWarehousingProviders)(createWarehousingProvider),
  updateWarehousingProvider: acl(actions.manageWarehousingProviders)(updateWarehousingProvider),
  removeWarehousingProvider: acl(actions.manageWarehousingProviders)(removeWarehousingProvider),
  exportToken: acl(actions.updateToken)(exportToken),
  invalidateToken: acl(actions.updateToken)(invalidateToken),
  createFilter: acl(actions.manageFilters)(createFilter),
  updateFilter: acl(actions.manageFilters)(updateFilter),
  removeFilter: acl(actions.manageFilters)(removeFilter),
  updateFilterTexts: acl(actions.manageFilters)(updateFilterTexts),
  removeFilterOption: acl(actions.manageFilters)(removeFilterOption),
  createFilterOption: acl(actions.manageFilters)(createFilterOption),
  createAssortment: acl(actions.manageAssortments)(createAssortment),
  prepareAssortmentMediaUpload: acl(actions.manageAssortments)(prepareAssortmentMediaUpload),
  updateAssortment: acl(actions.manageAssortments)(updateAssortment),
  removeAssortment: acl(actions.manageAssortments)(removeAssortment),
  reorderAssortmentMedia: acl(actions.manageAssortments)(reorderAssortmentMedia),
  removeAssortmentMedia: acl(actions.manageAssortments)(removeAssortmentMedia),
  updateAssortmentMediaTexts: acl(actions.manageAssortments)(updateAssortmentMediaTexts),
  updateAssortmentTexts: acl(actions.manageAssortments)(updateAssortmentTexts),
  addAssortmentProduct: acl(actions.manageAssortments)(addAssortmentProduct),
  removeAssortmentProduct: acl(actions.manageAssortments)(removeAssortmentProduct),
  reorderAssortmentProducts: acl(actions.manageAssortments)(reorderAssortmentProducts),
  addAssortmentLink: acl(actions.manageAssortments)(addAssortmentLink),
  removeAssortmentLink: acl(actions.manageAssortments)(removeAssortmentLink),
  reorderAssortmentLinks: acl(actions.manageAssortments)(reorderAssortmentLinks),
  addAssortmentFilter: acl(actions.manageAssortments)(addAssortmentFilter),
  removeAssortmentFilter: acl(actions.manageAssortments)(removeAssortmentFilter),
  reorderAssortmentFilters: acl(actions.manageAssortments)(reorderAssortmentFilters),
  createProductReview: acl(actions.reviewProduct)(createProductReview),
  updateProductReview: acl(actions.updateProductReview)(updateProductReview),
  removeProductReview: acl(actions.updateProductReview)(removeProductReview),
  addProductReviewVote: acl(actions.voteProductReview)(addProductReviewVote),
  removeProductReviewVote: acl(actions.voteProductReview)(removeProductReviewVote),
  requestQuotation: acl(actions.requestQuotation)(requestQuotation),
  rejectQuotation: acl(actions.answerQuotation)(rejectQuotation),
  verifyQuotation: acl(actions.manageQuotations)(verifyQuotation),
  makeQuotationProposal: acl(actions.manageQuotations)(makeQuotationProposal),
  bookmark: acl(actions.bookmarkProduct)(bookmark),
  createBookmark: acl(actions.manageBookmarks)(createBookmark),
  removeBookmark: acl(actions.manageBookmarks)(removeBookmark),
  addWork: acl(actions.manageWorker)(addWork),
  allocateWork: acl(actions.manageWorker)(allocateWork),
  finishWork: acl(actions.manageWorker)(finishWork),
  removeWork: acl(actions.manageWorker)(removeWork),
  processNextWork: acl(actions.manageWorker)(processNextWork),
  signPaymentProviderForCredentialRegistration: acl(actions.registerPaymentCredentials)(
    signPaymentProviderForCredentialRegistration,
  ),
  signPaymentProviderForCheckout: acl(actions.registerPaymentCredentials)(
    signPaymentProviderForCheckout,
  ),
  removeUserProductReviews: acl(actions.updateUser)(removeUserProductReviews),
};
