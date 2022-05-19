import { actions } from '../../roles';
import { checkResolver as acl } from '../../acl';
import loginWithPassword from './accounts/loginWithPassword';
import impersonate from './accounts/impersonate';
import loginAsGuest from './accounts/loginAsGuest';
import logout from './accounts/logout';
import logoutAllSessions from './accounts/logoutAllSessions';
import buildSecretTOTPAuthURL from './accounts/buildSecretTOTPAuthURL';
import enableTOTP from './accounts/enableTOTP';
import disableTOTP from './accounts/disableTOTP';
import changePassword from './accounts/changePassword';
import createUser from './accounts/createUser';
import verifyEmail from './accounts/verifyEmail';
import sendVerificationEmail from './accounts/sendVerificationEmail';
import sendEnrollmentEmail from './accounts/sendEnrollmentEmail';
import addAssortmentMedia from './assortments/addAssortmentMedia';
import forgotPassword from './accounts/forgotPassword';
import resetPassword from './accounts/resetPassword';
import addEmail from './accounts/addEmail';
import removeEmail from './accounts/removeEmail';
import updateUserAvatar from './users/updateUserAvatar';
import updateUserProfile from './users/updateUserProfile';
import setUserTags from './users/setUserTags';
import updateUserMeta from './users/updateUserMeta';
import createLanguage from './languages/createLanguage';
import updateLanguage from './languages/updateLanguage';
import removeLanguage from './languages/removeLanguage';
import createCountry from './countries/createCountry';
import updateCountry from './countries/updateCountry';
import removeCountry from './countries/removeCountry';
import createCurrency from './currencies/createCurrency';
import updateCurrency from './currencies/updateCurrency';
import removeCurrency from './currencies/removeCurrency';
import createProduct from './products/createProduct';
import publishProduct from './products/publishProduct';
import removeProduct from './products/removeProduct';
import unpublishProduct from './products/unpublishProduct';
import updateProduct from './products/updateProduct';
import updateProductTexts from './products/updateProductTexts';
import updateProductMediaTexts from './products/updateProductMediaTexts';
import createProductVariation from './products/createProductVariation';
import createProductBundleItem from './products/createProductBundleItem';
import removeBundleItem from './products/removeBundleItem';
import createProductVariationOption from './products/createProductVariationOption';
import removeProductVariation from './products/removeProductVariation';
import updateProductVariationTexts from './products/updateProductVariationTexts';
import removeProductVariationOption from './products/removeProductVariationOption';
import confirmMediaUpload from './files/confirmMediaUpload';
import addProductMedia from './products/addProductMedia';
import removeProductMedia from './products/removeProductMedia';
import reorderProductMedia from './products/reorderProductMedia';
import updateProductCommerce from './products/updateProductCommerce';
import updateProductWarehousing from './products/updateProductWarehousing';
import updateProductSupply from './products/updateProductSupply';
import updateProductPlan from './products/updateProductPlan';
import addProductAssignment from './products/addProductAssignment';
import removeProductAssignment from './products/removeProductAssignment';
import createCart from './orders/createCart';
import addCartProduct from './orders/addCartProduct';
import addMultipleCartProducts from './orders/addMultipleCartProducts';
import addCartDiscount from './orders/addCartDiscount';
import addCartQuotation from './orders/addCartQuotation';
import updateCart from './orders/updateCart';
import emptyCart from './orders/emptyCart';
import updateCartItem from './orders/updateCartItem';
import removeCartItem from './orders/removeCartItem';
import removeCartDiscount from './orders/removeCartDiscount';
import removeOrder from './orders/removeOrder';
import setOrderPaymentProvider from './orders/setOrderPaymentProvider';
import setOrderDeliveryProvider from './orders/setOrderDeliveryProvider';
import confirmOrder from './orders/confirmOrder';
import payOrder from './orders/payOrder';
import deliverOrder from './orders/deliverOrder';
import createPaymentProvider from './payment/createPaymentProvider';
import updatePaymentProvider from './payment/updatePaymentProvider';
import removePaymentProvider from './payment/removePaymentProvider';
import createDeliveryProvider from './delivery/createDeliveryProvider';
import updateDeliveryProvider from './delivery/updateDeliveryProvider';
import removeDeliveryProvider from './delivery/removeDeliveryProvider';
import createWarehousingProvider from './warehousing/createWarehousingProvider';
import updateWarehousingProvider from './warehousing/updateWarehousingProvider';
import removeWarehousingProvider from './warehousing/removeWarehousingProvider';
import setPassword from './accounts/setPassword';
import setRoles from './users/setRoles';
import setUsername from './accounts/setUsername';
import enrollUser from './accounts/enrollUser';
import checkoutCart from './orders/checkoutCart';
import createFilter from './filters/createFilter';
import updateFilter from './filters/updateFilter';
import createFilterOption from './filters/createFilterOption';
import removeFilter from './filters/removeFilter';
import updateFilterTexts from './filters/updateFilterTexts';
import removeFilterOption from './filters/removeFilterOption';
import createAssortment from './assortments/createAssortment';
import updateAssortment from './assortments/updateAssortment';
import setBaseAssortment from './assortments/setBaseAssortment';
import removeAssortment from './assortments/removeAssortment';
import updateAssortmentTexts from './assortments/updateAssortmentTexts';
import addAssortmentProduct from './assortments/addAssortmentProduct';
import removeAssortmentProduct from './assortments/removeAssortmentProduct';
import reorderAssortmentProducts from './assortments/reorderAssortmentProducts';
import addAssortmentLink from './assortments/addAssortmentLink';
import removeAssortmentLink from './assortments/removeAssortmentLink';
import reorderAssortmentLinks from './assortments/reorderAssortmentLinks';
import addAssortmentFilter from './assortments/addAssortmentFilter';
import removeAssortmentFilter from './assortments/removeAssortmentFilter';
import reorderAssortmentFilters from './assortments/reorderAssortmentFilters';
import createProductReview from './products/createProductReview';
import updateProductReview from './products/updateProductReview';
import removeProductReview from './products/removeProductReview';
import addProductReviewVote from './products/addProductReviewVote';
import removeProductReviewVote from './products/removeProductReviewVote';
import requestQuotation from './quotations/requestQuotation';
import rejectQuotation from './quotations/rejectQuotation';
import verifyQuotation from './quotations/verifyQuotation';
import makeQuotationProposal from './quotations/makeQuotationProposal';
import bookmark from './bookmarks/bookmark';
import createBookmark from './bookmarks/createBookmark';
import removeBookmark from './bookmarks/removeBookmark';
import addWork from './worker/addWork';
import allocateWork from './worker/allocateWork';
import finishWork from './worker/finishWork';
import removeWork from './worker/removeWork';
import doWork from './worker/doWork';
import heartbeat from './users/heartbeat';
import createEnrollment from './enrollments/createEnrollment';
import terminateEnrollment from './enrollments/terminateEnrollment';
import activateEnrollment from './enrollments/activateEnrollment';
import updateEnrollment from './enrollments/updateEnrollment';
import registerPaymentCredentials from './payment/registerPaymentCredentials';
import markPaymentCredentialsPreferred from './payment/markPaymentCredentialsPreferred';
import removePaymentCredentials from './payment/removePaymentCredentials';
import updateOrderDeliveryShipping from './orders/updateOrderDeliveryShipping';
import updateOrderDeliveryPickUp from './orders/updateOrderDeliveryPickUp';
import updateOrderPaymentGeneric from './orders/updateOrderPaymentGeneric';
import updateOrderPaymentCard from './orders/updateOrderPaymentCard';
import updateOrderPaymentInvoice from './orders/updateOrderPaymentInvoice';
import signPaymentProviderForCredentialRegistration from './payment/signPaymentProviderForCredentialRegistration';
import signPaymentProviderForCheckout from './orders/signPaymentProviderForCheckout';
import pageView from './pageView';
import reorderAssortmentMedia from './assortments/reorderAssortmentMedia';
import removeAssortmentMedia from './assortments/removeAssortmentMedia';
import updateAssortmentMediaTexts from './assortments/updateAssortmentMediaTexts';
import prepareProductMediaUpload from './products/prepareProductMediaUpload';
import prepareAssortmentMediaUpload from './assortments/prepareAssortmentMediaUpload';
import prepareUserAvatarUpload from './users/prepareUserAvatarUpload';
import rejectOrder from './orders/rejectOrder';

export default {
  logout,
  logoutAllSessions,
  loginAsGuest,
  verifyEmail,
  loginWithPassword,
  impersonate: acl(actions.impersonate)(impersonate),
  buildSecretTOTPAuthURL: acl(actions.authTwoFactor)(buildSecretTOTPAuthURL),
  enableTOTP: acl(actions.authTwoFactor)(enableTOTP),
  disableTOTP: acl(actions.manageTwoFactor)(disableTOTP),
  pageView,
  createUser,
  forgotPassword,
  resetPassword,
  sendVerificationEmail: acl(actions.sendEmail)(sendVerificationEmail),
  sendEnrollmentEmail: acl(actions.sendEmail)(sendEnrollmentEmail),
  changePassword,
  heartbeat,
  addEmail: acl(actions.updateUser)(addEmail),
  removeEmail: acl(actions.updateUser)(removeEmail),
  updateUserAvatar: acl(actions.updateUser)(updateUserAvatar),
  prepareUserAvatarUpload: acl(actions.updateUser)(prepareUserAvatarUpload),
  updateUserProfile: acl(actions.updateUser)(updateUserProfile),
  setUserTags: acl(actions.manageUsers)(setUserTags),
  updateUserMeta: acl(actions.manageUsers)(updateUserMeta),
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
  addProductMedia: acl(actions.manageProducts)(addProductMedia),
  confirmMediaUpload: acl(actions.manageProducts)(confirmMediaUpload),
  prepareProductMediaUpload: acl(actions.manageProducts)(prepareProductMediaUpload),
  reorderProductMedia: acl(actions.manageProducts)(reorderProductMedia),
  removeProductMedia: acl(actions.manageProducts)(removeProductMedia),
  updateProductCommerce: acl(actions.manageProducts)(updateProductCommerce),
  updateProductWarehousing: acl(actions.manageProducts)(updateProductWarehousing),
  updateProductSupply: acl(actions.manageProducts)(updateProductSupply),
  updateProductPlan: acl(actions.manageProducts)(updateProductPlan),
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

  createFilter: acl(actions.manageFilters)(createFilter),
  updateFilter: acl(actions.manageFilters)(updateFilter),
  removeFilter: acl(actions.manageFilters)(removeFilter),
  updateFilterTexts: acl(actions.manageFilters)(updateFilterTexts),
  removeFilterOption: acl(actions.manageFilters)(removeFilterOption),
  createFilterOption: acl(actions.manageFilters)(createFilterOption),

  createAssortment: acl(actions.manageAssortments)(createAssortment),
  addAssortmentMedia: acl(actions.manageAssortments)(addAssortmentMedia),
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
  doWork: acl(actions.manageWorker)(doWork),
  signPaymentProviderForCredentialRegistration: acl(actions.registerPaymentCredentials)(
    signPaymentProviderForCredentialRegistration,
  ),
  signPaymentProviderForCheckout: acl(actions.registerPaymentCredentials)(
    signPaymentProviderForCheckout,
  ),
};
