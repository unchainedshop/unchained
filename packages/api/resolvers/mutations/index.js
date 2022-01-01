import { actions } from '../../roles';
import { checkResolver as acl } from '../../acl';
import loginWithPassword from './accounts/loginWithPassword';
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
import addAssortmentMedia from './addAssortmentMedia';
import forgotPassword from './accounts/forgotPassword';
import resetPassword from './users/resetPassword';
import updateEmail from './users/updateEmail';
import addEmail from './accounts/addEmail';
import removeEmail from './accounts/removeEmail';
import updateUserAvatar from './users/updateUserAvatar';
import updateUserProfile from './users/updateUserProfile';
import setUserTags from './users/setUserTags';
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
import publishProduct from './publishProduct';
import removeProduct from './products/removeProduct';
import unpublishProduct from './products/unpublishProduct';
import updateProduct from './updateProduct';
import updateProductTexts from './updateProductTexts';
import updateProductMediaTexts from './products/updateProductMediaTexts';
import createProductVariation from './createProductVariation';
import createProductBundleItem from './createProductBundleItem';
import removeBundleItem from './removeBundleItem';
import createProductVariationOption from './createProductVariationOption';
import removeProductVariation from './removeProductVariation';
import updateProductVariationTexts from './updateProductVariationTexts';
import removeProductVariationOption from './removeProductVariationOption';
import confirmMediaUpload from './files/confirmMediaUpload';
import addProductMedia from './products/addProductMedia';
import removeProductMedia from './products/removeProductMedia';
import reorderProductMedia from './reorderProductMedia';
import updateProductCommerce from './updateProductCommerce';
import updateProductWarehousing from './updateProductWarehousing';
import updateProductSupply from './updateProductSupply';
import updateProductPlan from './updateProductPlan';
import addProductAssignment from './products/addProductAssignment';
import removeProductAssignment from './removeProductAssignment';
import createCart from './createCart';
import addCartProduct from './addCartProduct';
import addMultipleCartProducts from './orders/addMultipleCartProducts';
import addCartDiscount from './orders/addCartDiscount';
import addCartQuotation from './addCartQuotation';
import updateCart from './orders/updateCart';
import emptyCart from './orders/emptyCart';
import updateCartItem from './updateCartItem';
import removeCartItem from './removeCartItem';
import removeCartDiscount from './removeCartDiscount';
import removeOrder from './removeOrder';
import setOrderPaymentProvider from './setOrderPaymentProvider';
import setOrderDeliveryProvider from './orders/setOrderDeliveryProvider';
import confirmOrder from './confirmOrder';
import payOrder from './orders/payOrder';
import deliverOrder from './deliverOrder';
import createPaymentProvider from './payment/createPaymentProvider';
import updatePaymentProvider from './payment/updatePaymentProvider';
import removePaymentProvider from './payment/removePaymentProvider';
import createDeliveryProvider from './createDeliveryProvider';
import updateDeliveryProvider from './updateDeliveryProvider';
import removeDeliveryProvider from './removeDeliveryProvider';
import createWarehousingProvider from './createWarehousingProvider';
import updateWarehousingProvider from './updateWarehousingProvider';
import removeWarehousingProvider from './removeWarehousingProvider';
import setPassword from './accounts/setPassword';
import setRoles from './users/setRoles';
import setUsername from './accounts/setUsername';
import enrollUser from './accounts/enrollUser';
import checkoutCart from './orders/checkoutCart';
import createFilter from './createFilter';
import updateFilter from './updateFilter';
import createFilterOption from './createFilterOption';
import removeFilter from './removeFilter';
import updateFilterTexts from './updateFilterTexts';
import removeFilterOption from './removeFilterOption';
import createAssortment from './assortments/createAssortment';
import updateAssortment from './updateAssortment';
import setBaseAssortment from './setBaseAssortment';
import removeAssortment from './assortments/removeAssortment';
import updateAssortmentTexts from './updateAssortmentTexts';
import addAssortmentProduct from './addAssortmentProduct';
import removeAssortmentProduct from './removeAssortmentProduct';
import reorderAssortmentProducts from './reorderAssortmentProducts';
import addAssortmentLink from './addAssortmentLink';
import removeAssortmentLink from './removeAssortmentLink';
import reorderAssortmentLinks from './reorderAssortmentLinks';
import addAssortmentFilter from './assortments/addAssortmentFilter';
import removeAssortmentFilter from './removeAssortmentFilter';
import reorderAssortmentFilters from './assortments/reorderAssortmentFilters';
import createProductReview from './createProductReview';
import updateProductReview from './updateProductReview';
import removeProductReview from './removeProductReview';
import addProductReviewVote from './products/addProductReviewVote';
import removeProductReviewVote from './removeProductReviewVote';
import requestQuotation from './requestQuotation';
import rejectQuotation from './rejectQuotation';
import verifyQuotation from './verifyQuotation';
import makeQuotationProposal from './makeQuotationProposal';
import bookmark from './bookmarks/bookmark';
import createBookmark from './bookmarks/createBookmark';
import removeBookmark from './bookmarks/removeBookmark';
import addWork from './addWork';
import allocateWork from './allocateWork';
import finishWork from './finishWork';
import removeWork from './removeWork';
import doWork from './doWork';
import heartbeat from './users/heartbeat';
import createEnrollment from './createEnrollment';
import terminateEnrollment from './terminateEnrollment';
import activateEnrollment from './activateEnrollment';
import updateEnrollment from './updateEnrollment';
import registerPaymentCredentials from './payment/registerPaymentCredentials';
import markPaymentCredentialsPreferred from './payment/markPaymentCredentialsPreferred';
import removePaymentCredentials from './payment/removePaymentCredentials';
import updateOrderDeliveryShipping from './updateOrderDeliveryShipping';
import updateOrderDeliveryPickUp from './updateOrderDeliveryPickUp';
import updateOrderPaymentGeneric from './updateOrderPaymentGeneric';
import updateOrderPaymentCard from './updateOrderPaymentCard';
import updateOrderPaymentInvoice from './updateOrderPaymentInvoice';
import signPaymentProviderForCredentialRegistration from './payment/signPaymentProviderForCredentialRegistration';
import signPaymentProviderForCheckout from './signPaymentProviderForCheckout';
import pageView from './pageView';
import reorderAssortmentMedia from './reorderAssortmentMedia';
import removeAssortmentMedia from './removeAssortmentMedia';
import updateAssortmentMediaTexts from './updateAssortmentMediaTexts';
import prepareProductMediaUpload from './products/prepareProductMediaUpload';
import prepareAssortmentMediaUpload from './assortments/prepareAssortmentMediaUpload';
import prepareUserAvatarUpload from './users/prepareUserAvatarUpload';

export default {
  logout,
  logoutAllSessions,
  loginAsGuest,
  verifyEmail,
  loginWithPassword,
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
  updateEmail: acl(actions.updateUser)(updateEmail),
  addEmail: acl(actions.updateUser)(addEmail),
  removeEmail: acl(actions.updateUser)(removeEmail),
  updateUserAvatar: acl(actions.updateUser)(updateUserAvatar),
  prepareUserAvatarUpload: acl(actions.updateUser)(prepareUserAvatarUpload),
  updateUserProfile: acl(actions.updateUser)(updateUserProfile),
  setUserTags: acl(actions.manageUsers)(setUserTags),
  setPassword: acl(actions.manageUsers)(setPassword),
  setUsername: acl(actions.manageUsers)(setUsername),
  setRoles: acl(actions.manageUsers)(setRoles),
  enrollUser: acl(actions.manageUsers)(enrollUser),
  registerPaymentCredentials: acl(actions.registerPaymentCredentials)(
    registerPaymentCredentials
  ),
  markPaymentCredentialsPreferred: acl(actions.managePaymentCredentials)(
    markPaymentCredentialsPreferred
  ),
  removePaymentCredentials: acl(actions.managePaymentCredentials)(
    removePaymentCredentials
  ),

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
  prepareProductMediaUpload: acl(actions.manageProducts)(
    prepareProductMediaUpload
  ),
  reorderProductMedia: acl(actions.manageProducts)(reorderProductMedia),
  removeProductMedia: acl(actions.manageProducts)(removeProductMedia),
  updateProductCommerce: acl(actions.manageProducts)(updateProductCommerce),
  updateProductWarehousing: acl(actions.manageProducts)(
    updateProductWarehousing
  ),
  updateProductSupply: acl(actions.manageProducts)(updateProductSupply),
  updateProductPlan: acl(actions.manageProducts)(updateProductPlan),
  removeProductVariation: acl(actions.manageProducts)(removeProductVariation),
  updateProductVariationTexts: acl(actions.manageProducts)(
    updateProductVariationTexts
  ),
  removeProductVariationOption: acl(actions.manageProducts)(
    removeProductVariationOption
  ),
  createProductVariation: acl(actions.manageProducts)(createProductVariation),
  createProductBundleItem: acl(actions.manageProducts)(createProductBundleItem),
  removeBundleItem: acl(actions.manageProducts)(removeBundleItem),
  createProductVariationOption: acl(actions.manageProducts)(
    createProductVariationOption
  ),
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
  updateOrderDeliveryShipping: acl(actions.updateOrderDelivery)(
    updateOrderDeliveryShipping
  ),
  updateOrderDeliveryPickUp: acl(actions.updateOrderDelivery)(
    updateOrderDeliveryPickUp
  ),
  updateOrderPaymentGeneric: acl(actions.updateOrderPayment)(
    updateOrderPaymentGeneric
  ),
  updateOrderPaymentCard: acl(actions.updateOrderPayment)(
    updateOrderPaymentCard
  ),
  updateOrderPaymentInvoice: acl(actions.updateOrderPayment)(
    updateOrderPaymentInvoice
  ),
  removeOrder: acl(actions.updateOrder)(removeOrder),
  confirmOrder: acl(actions.markOrderConfirmed)(confirmOrder),
  payOrder: acl(actions.markOrderPaid)(payOrder),
  deliverOrder: acl(actions.markOrderDelivered)(deliverOrder),

  createEnrollment: acl(actions.createEnrollment)(createEnrollment),
  terminateEnrollment: acl(actions.updateEnrollment)(terminateEnrollment),
  activateEnrollment: acl(actions.updateEnrollment)(activateEnrollment),
  updateEnrollment: acl(actions.updateEnrollment)(updateEnrollment),

  createPaymentProvider: acl(actions.managePaymentProviders)(
    createPaymentProvider
  ),
  updatePaymentProvider: acl(actions.managePaymentProviders)(
    updatePaymentProvider
  ),
  removePaymentProvider: acl(actions.managePaymentProviders)(
    removePaymentProvider
  ),

  createDeliveryProvider: acl(actions.manageDeliveryProviders)(
    createDeliveryProvider
  ),
  updateDeliveryProvider: acl(actions.manageDeliveryProviders)(
    updateDeliveryProvider
  ),
  removeDeliveryProvider: acl(actions.manageDeliveryProviders)(
    removeDeliveryProvider
  ),

  createWarehousingProvider: acl(actions.manageWarehousingProviders)(
    createWarehousingProvider
  ),
  updateWarehousingProvider: acl(actions.manageWarehousingProviders)(
    updateWarehousingProvider
  ),
  removeWarehousingProvider: acl(actions.manageWarehousingProviders)(
    removeWarehousingProvider
  ),

  createFilter: acl(actions.manageFilters)(createFilter),
  updateFilter: acl(actions.manageFilters)(updateFilter),
  removeFilter: acl(actions.manageFilters)(removeFilter),
  updateFilterTexts: acl(actions.manageFilters)(updateFilterTexts),
  removeFilterOption: acl(actions.manageFilters)(removeFilterOption),
  createFilterOption: acl(actions.manageFilters)(createFilterOption),

  createAssortment: acl(actions.manageAssortments)(createAssortment),
  addAssortmentMedia: acl(actions.manageAssortments)(addAssortmentMedia),
  prepareAssortmentMediaUpload: acl(actions.manageAssortments)(
    prepareAssortmentMediaUpload
  ),
  updateAssortment: acl(actions.manageAssortments)(updateAssortment),
  setBaseAssortment: acl(actions.manageAssortments)(setBaseAssortment),
  removeAssortment: acl(actions.manageAssortments)(removeAssortment),
  reorderAssortmentMedia: acl(actions.manageAssortments)(
    reorderAssortmentMedia
  ),
  removeAssortmentMedia: acl(actions.manageAssortments)(removeAssortmentMedia),
  updateAssortmentMediaTexts: acl(actions.manageAssortments)(
    updateAssortmentMediaTexts
  ),
  updateAssortmentTexts: acl(actions.manageAssortments)(updateAssortmentTexts),
  addAssortmentProduct: acl(actions.manageAssortments)(addAssortmentProduct),
  removeAssortmentProduct: acl(actions.manageAssortments)(
    removeAssortmentProduct
  ),
  reorderAssortmentProducts: acl(actions.manageAssortments)(
    reorderAssortmentProducts
  ),
  addAssortmentLink: acl(actions.manageAssortments)(addAssortmentLink),
  removeAssortmentLink: acl(actions.manageAssortments)(removeAssortmentLink),
  reorderAssortmentLinks: acl(actions.manageAssortments)(
    reorderAssortmentLinks
  ),
  addAssortmentFilter: acl(actions.manageAssortments)(addAssortmentFilter),
  removeAssortmentFilter: acl(actions.manageAssortments)(
    removeAssortmentFilter
  ),
  reorderAssortmentFilters: acl(actions.manageAssortments)(
    reorderAssortmentFilters
  ),

  createProductReview: acl(actions.reviewProduct)(createProductReview),
  updateProductReview: acl(actions.updateProductReview)(updateProductReview),
  removeProductReview: acl(actions.updateProductReview)(removeProductReview),
  addProductReviewVote: acl(actions.voteProductReview)(addProductReviewVote),
  removeProductReviewVote: acl(actions.voteProductReview)(
    removeProductReviewVote
  ),

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
  signPaymentProviderForCredentialRegistration: acl(
    actions.registerPaymentCredentials
  )(signPaymentProviderForCredentialRegistration),
  signPaymentProviderForCheckout: acl(actions.registerPaymentCredentials)(
    signPaymentProviderForCheckout
  ),
};
