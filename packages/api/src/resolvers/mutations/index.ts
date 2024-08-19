import { actions } from '../../roles/index.js';
import { checkResolver as acl } from '../../acl.js';
import loginWithPassword from './accounts/loginWithPassword.js';
import loginWithWebAuthn from './accounts/loginWithWebAuthn.js';
import loginAsGuest from './accounts/loginAsGuest.js';
import logout from './accounts/logout.js';
import changePassword from './accounts/changePassword.js';
import createUser from './accounts/createUser.js';
import verifyEmail from './accounts/verifyEmail.js';
import sendVerificationEmail from './accounts/sendVerificationEmail.js';
import sendEnrollmentEmail from './accounts/sendEnrollmentEmail.js';
import forgotPassword from './accounts/forgotPassword.js';
import resetPassword from './accounts/resetPassword.js';
import addEmail from './accounts/addEmail.js';
import removeEmail from './accounts/removeEmail.js';
import createWebAuthnCredentialCreationOptions from './accounts/createWebAuthnCredentialCreationOptions.js';
import createWebAuthnCredentialRequestOptions from './accounts/createWebAuthnCredentialRequestOptions.js';
import addWebAuthnCredentials from './accounts/addWebAuthnCredentials.js';
import removeWebAuthnCredentials from './accounts/removeWebAuthnCredentials.js';
import addWeb3Address from './accounts/addWeb3Address.js';
import removeWeb3Address from './accounts/removeWeb3Address.js';
import verifyWeb3Address from './accounts/verifyWeb3Address.js';
import updateUserProfile from './users/updateUserProfile.js';
import removeUser from './users/removeUser.js';
import setUserTags from './users/setUserTags.js';
import createLanguage from './languages/createLanguage.js';
import updateLanguage from './languages/updateLanguage.js';
import removeLanguage from './languages/removeLanguage.js';
import createCountry from './countries/createCountry.js';
import updateCountry from './countries/updateCountry.js';
import removeCountry from './countries/removeCountry.js';
import createCurrency from './currencies/createCurrency.js';
import updateCurrency from './currencies/updateCurrency.js';
import removeCurrency from './currencies/removeCurrency.js';
import createProduct from './products/createProduct.js';
import publishProduct from './products/publishProduct.js';
import removeProduct from './products/removeProduct.js';
import unpublishProduct from './products/unpublishProduct.js';
import updateProduct from './products/updateProduct.js';
import updateProductTexts from './products/updateProductTexts.js';
import updateProductTokenization from './products/updateProductTokenization.js';
import updateProductMediaTexts from './products/updateProductMediaTexts.js';
import createProductVariation from './products/createProductVariation.js';
import createProductBundleItem from './products/createProductBundleItem.js';
import removeBundleItem from './products/removeBundleItem.js';
import createProductVariationOption from './products/createProductVariationOption.js';
import removeProductVariation from './products/removeProductVariation.js';
import updateProductVariationTexts from './products/updateProductVariationTexts.js';
import removeProductVariationOption from './products/removeProductVariationOption.js';
import confirmMediaUpload from './files/confirmMediaUpload.js';
import removeProductMedia from './products/removeProductMedia.js';
import reorderProductMedia from './products/reorderProductMedia.js';
import updateProductCommerce from './products/updateProductCommerce.js';
import updateProductWarehousing from './products/updateProductWarehousing.js';
import updateProductSupply from './products/updateProductSupply.js';
import updateProductPlan from './products/updateProductPlan.js';
import addProductAssignment from './products/addProductAssignment.js';
import removeProductAssignment from './products/removeProductAssignment.js';
import createCart from './orders/createCart.js';
import addCartProduct from './orders/addCartProduct.js';
import addMultipleCartProducts from './orders/addMultipleCartProducts.js';
import addCartDiscount from './orders/addCartDiscount.js';
import addCartQuotation from './orders/addCartQuotation.js';
import updateCart from './orders/updateCart.js';
import emptyCart from './orders/emptyCart.js';
import updateCartItem from './orders/updateCartItem.js';
import removeCartItem from './orders/removeCartItem.js';
import removeCartDiscount from './orders/removeCartDiscount.js';
import removeOrder from './orders/removeOrder.js';
import setOrderPaymentProvider from './orders/setOrderPaymentProvider.js';
import setOrderDeliveryProvider from './orders/setOrderDeliveryProvider.js';
import confirmOrder from './orders/confirmOrder.js';
import payOrder from './orders/payOrder.js';
import deliverOrder from './orders/deliverOrder.js';
import createPaymentProvider from './payment/createPaymentProvider.js';
import updatePaymentProvider from './payment/updatePaymentProvider.js';
import removePaymentProvider from './payment/removePaymentProvider.js';
import createDeliveryProvider from './delivery/createDeliveryProvider.js';
import updateDeliveryProvider from './delivery/updateDeliveryProvider.js';
import removeDeliveryProvider from './delivery/removeDeliveryProvider.js';
import createWarehousingProvider from './warehousing/createWarehousingProvider.js';
import updateWarehousingProvider from './warehousing/updateWarehousingProvider.js';
import removeWarehousingProvider from './warehousing/removeWarehousingProvider.js';
import exportToken from './warehousing/exportToken.js';
import invalidateToken from './warehousing/invalidateToken.js';
import setPassword from './accounts/setPassword.js';
import setRoles from './users/setRoles.js';
import setUsername from './accounts/setUsername.js';
import enrollUser from './accounts/enrollUser.js';
import checkoutCart from './orders/checkoutCart.js';
import createFilter from './filters/createFilter.js';
import updateFilter from './filters/updateFilter.js';
import createFilterOption from './filters/createFilterOption.js';
import removeFilter from './filters/removeFilter.js';
import updateFilterTexts from './filters/updateFilterTexts.js';
import removeFilterOption from './filters/removeFilterOption.js';
import createAssortment from './assortments/createAssortment.js';
import updateAssortment from './assortments/updateAssortment.js';
import setBaseAssortment from './assortments/setBaseAssortment.js';
import removeAssortment from './assortments/removeAssortment.js';
import updateAssortmentTexts from './assortments/updateAssortmentTexts.js';
import addAssortmentProduct from './assortments/addAssortmentProduct.js';
import removeAssortmentProduct from './assortments/removeAssortmentProduct.js';
import reorderAssortmentProducts from './assortments/reorderAssortmentProducts.js';
import addAssortmentLink from './assortments/addAssortmentLink.js';
import removeAssortmentLink from './assortments/removeAssortmentLink.js';
import reorderAssortmentLinks from './assortments/reorderAssortmentLinks.js';
import addAssortmentFilter from './assortments/addAssortmentFilter.js';
import removeAssortmentFilter from './assortments/removeAssortmentFilter.js';
import reorderAssortmentFilters from './assortments/reorderAssortmentFilters.js';
import createProductReview from './products/createProductReview.js';
import updateProductReview from './products/updateProductReview.js';
import removeProductReview from './products/removeProductReview.js';
import addProductReviewVote from './products/addProductReviewVote.js';
import removeProductReviewVote from './products/removeProductReviewVote.js';
import requestQuotation from './quotations/requestQuotation.js';
import rejectQuotation from './quotations/rejectQuotation.js';
import verifyQuotation from './quotations/verifyQuotation.js';
import makeQuotationProposal from './quotations/makeQuotationProposal.js';
import bookmark from './bookmarks/bookmark.js';
import createBookmark from './bookmarks/createBookmark.js';
import removeBookmark from './bookmarks/removeBookmark.js';
import addWork from './worker/addWork.js';
import allocateWork from './worker/allocateWork.js';
import finishWork from './worker/finishWork.js';
import processNextWork from './worker/processNextWork.js';
import removeWork from './worker/removeWork.js';
import heartbeat from './users/heartbeat.js';
import createEnrollment from './enrollments/createEnrollment.js';
import terminateEnrollment from './enrollments/terminateEnrollment.js';
import activateEnrollment from './enrollments/activateEnrollment.js';
import updateEnrollment from './enrollments/updateEnrollment.js';
import registerPaymentCredentials from './payment/registerPaymentCredentials.js';
import markPaymentCredentialsPreferred from './payment/markPaymentCredentialsPreferred.js';
import removePaymentCredentials from './payment/removePaymentCredentials.js';
import updateOrderDeliveryShipping from './orders/updateOrderDeliveryShipping.js';
import updateOrderDeliveryPickUp from './orders/updateOrderDeliveryPickUp.js';
import updateOrderPaymentGeneric from './orders/updateOrderPaymentGeneric.js';
import updateOrderPaymentCard from './orders/updateOrderPaymentCard.js';
import updateOrderPaymentInvoice from './orders/updateOrderPaymentInvoice.js';
import signPaymentProviderForCredentialRegistration from './payment/signPaymentProviderForCredentialRegistration.js';
import signPaymentProviderForCheckout from './orders/signPaymentProviderForCheckout.js';
import pageView from './pageView.js';
import reorderAssortmentMedia from './assortments/reorderAssortmentMedia.js';
import removeAssortmentMedia from './assortments/removeAssortmentMedia.js';
import updateAssortmentMediaTexts from './assortments/updateAssortmentMediaTexts.js';
import prepareProductMediaUpload from './products/prepareProductMediaUpload.js';
import prepareAssortmentMediaUpload from './assortments/prepareAssortmentMediaUpload.js';
import prepareUserAvatarUpload from './users/prepareUserAvatarUpload.js';
import rejectOrder from './orders/rejectOrder.js';
import removePushSubscription from './users/removePushSubscription.js';
import addPushSubscription from './users/addPushSubscription.js';
import deleteAccount from './users/deleteAccount.js';

export default {
  logout: acl(actions.logout)(logout),
  loginAsGuest: acl(actions.loginAsGuest)(loginAsGuest),
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
  prepareUserAvatarUpload: acl(actions.updateUser)(prepareUserAvatarUpload),
  updateUserProfile: acl(actions.updateUser)(updateUserProfile),
  removeUser: acl(actions.updateUser)(removeUser),
  setUserTags: acl(actions.manageUsers)(setUserTags),
  setPassword: acl(actions.manageUsers)(setPassword),
  setUsername: acl(actions.updateUsername)(setUsername),
  setRoles: acl(actions.manageUsers)(setRoles),
  enrollUser: acl(actions.manageUsers)(enrollUser),
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
  setOrderPaymentProvider: acl(actions.updateOrder)(setOrderPaymentProvider),
  setOrderDeliveryProvider: acl(actions.updateOrder)(setOrderDeliveryProvider),
  updateOrderDeliveryShipping: acl(actions.updateOrderDelivery)(updateOrderDeliveryShipping),
  updateOrderDeliveryPickUp: acl(actions.updateOrderDelivery)(updateOrderDeliveryPickUp),
  updateOrderPaymentGeneric: acl(actions.updateOrderPayment)(updateOrderPaymentGeneric),
  updateOrderPaymentCard: acl(actions.updateOrderPayment)(updateOrderPaymentCard),
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
  setBaseAssortment: acl(actions.manageAssortments)(setBaseAssortment),
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
  deleteAccount,
};
