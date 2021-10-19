import { actions } from '../../roles';
import { checkResolver as acl } from '../../acl';
import loginWithPassword from './loginWithPassword';
import loginAsGuest from './loginAsGuest';
import logout from './logout';
import logoutAllSessions from './logoutAllSessions';
import buildSecretTOTPAuthURL from './buildSecretTOTPAuthURL';
import enableTOTP from './enableTOTP';
import disableTOTP from './disableTOTP';
import changePassword from './changePassword';
import createUser from './createUser';
import verifyEmail from './verifyEmail';
import sendVerificationEmail from './sendVerificationEmail';
import sendEnrollmentEmail from './sendEnrollmentEmail';
import addAssortmentMedia from './addAssortmentMedia';
import forgotPassword from './forgotPassword';
import resetPassword from './resetPassword';
import updateEmail from './updateEmail';
import addEmail from './addEmail';
import removeEmail from './removeEmail';
import updateUserAvatar from './updateUserAvatar';
import updateUserProfile from './updateUserProfile';
import setUserTags from './setUserTags';
import createLanguage from './createLanguage';
import updateLanguage from './updateLanguage';
import removeLanguage from './removeLanguage';
import createCountry from './createCountry';
import updateCountry from './updateCountry';
import removeCountry from './removeCountry';
import createCurrency from './createCurrency';
import updateCurrency from './updateCurrency';
import removeCurrency from './removeCurrency';
import createProduct from './createProduct';
import publishProduct from './publishProduct';
import removeProduct from './removeProduct';
import unpublishProduct from './unpublishProduct';
import updateProduct from './updateProduct';
import updateProductTexts from './updateProductTexts';
import updateProductMediaTexts from './updateProductMediaTexts';
import createProductVariation from './createProductVariation';
import createProductBundleItem from './createProductBundleItem';
import removeBundleItem from './removeBundleItem';
import createProductVariationOption from './createProductVariationOption';
import removeProductVariation from './removeProductVariation';
import updateProductVariationTexts from './updateProductVariationTexts';
import removeProductVariationOption from './removeProductVariationOption';
import addProductMedia from './addProductMedia';
import removeProductMedia from './removeProductMedia';
import reorderProductMedia from './reorderProductMedia';
import updateProductCommerce from './updateProductCommerce';
import updateProductWarehousing from './updateProductWarehousing';
import updateProductSupply from './updateProductSupply';
import updateProductPlan from './updateProductPlan';
import addProductAssignment from './addProductAssignment';
import removeProductAssignment from './removeProductAssignment';
import createCart from './createCart';
import addCartProduct from './addCartProduct';
import addMultipleCartProducts from './addMultipleCartProducts';
import addCartDiscount from './addCartDiscount';
import addCartQuotation from './addCartQuotation';
import updateCart from './updateCart';
import emptyCart from './emptyCart';
import updateCartItem from './updateCartItem';
import removeCartItem from './removeCartItem';
import removeCartDiscount from './removeCartDiscount';
import removeOrder from './removeOrder';
import setOrderPaymentProvider from './setOrderPaymentProvider';
import setOrderDeliveryProvider from './setOrderDeliveryProvider';
import confirmOrder from './confirmOrder';
import payOrder from './payOrder';
import deliverOrder from './deliverOrder';
import createPaymentProvider from './createPaymentProvider';
import updatePaymentProvider from './updatePaymentProvider';
import removePaymentProvider from './removePaymentProvider';
import createDeliveryProvider from './createDeliveryProvider';
import updateDeliveryProvider from './updateDeliveryProvider';
import removeDeliveryProvider from './removeDeliveryProvider';
import createWarehousingProvider from './createWarehousingProvider';
import updateWarehousingProvider from './updateWarehousingProvider';
import removeWarehousingProvider from './removeWarehousingProvider';
import setPassword from './setPassword';
import setRoles from './setRoles';
import setUsername from './setUsername';
import enrollUser from './enrollUser';
import checkoutCart from './checkoutCart';
import createFilter from './createFilter';
import updateFilter from './updateFilter';
import createFilterOption from './createFilterOption';
import removeFilter from './removeFilter';
import updateFilterTexts from './updateFilterTexts';
import removeFilterOption from './removeFilterOption';
import createAssortment from './createAssortment';
import updateAssortment from './updateAssortment';
import setBaseAssortment from './setBaseAssortment';
import removeAssortment from './removeAssortment';
import updateAssortmentTexts from './updateAssortmentTexts';
import addAssortmentProduct from './addAssortmentProduct';
import removeAssortmentProduct from './removeAssortmentProduct';
import reorderAssortmentProducts from './reorderAssortmentProducts';
import addAssortmentLink from './addAssortmentLink';
import removeAssortmentLink from './removeAssortmentLink';
import reorderAssortmentLinks from './reorderAssortmentLinks';
import addAssortmentFilter from './addAssortmentFilter';
import removeAssortmentFilter from './removeAssortmentFilter';
import reorderAssortmentFilters from './reorderAssortmentFilters';
import createProductReview from './createProductReview';
import updateProductReview from './updateProductReview';
import removeProductReview from './removeProductReview';
import addProductReviewVote from './addProductReviewVote';
import removeProductReviewVote from './removeProductReviewVote';
import requestQuotation from './requestQuotation';
import rejectQuotation from './rejectQuotation';
import verifyQuotation from './verifyQuotation';
import makeQuotationProposal from './makeQuotationProposal';
import bookmark from './bookmark';
import createBookmark from './createBookmark';
import removeBookmark from './removeBookmark';
import addWork from './addWork';
import allocateWork from './allocateWork';
import finishWork from './finishWork';
import removeWork from './removeWork';
import doWork from './doWork';
import heartbeat from './heartbeat';
import createEnrollment from './createEnrollment';
import terminateEnrollment from './terminateEnrollment';
import activateEnrollment from './activateEnrollment';
import updateEnrollment from './updateEnrollment';
import registerPaymentCredentials from './registerPaymentCredentials';
import markPaymentCredentialsPreferred from './markPaymentCredentialsPreferred';
import removePaymentCredentials from './removePaymentCredentials';
import updateOrderDeliveryShipping from './updateOrderDeliveryShipping';
import updateOrderDeliveryPickUp from './updateOrderDeliveryPickUp';
import updateOrderPaymentGeneric from './updateOrderPaymentGeneric';
import updateOrderPaymentCard from './updateOrderPaymentCard';
import updateOrderPaymentInvoice from './updateOrderPaymentInvoice';
import signPaymentProviderForCredentialRegistration from './signPaymentProviderForCredentialRegistration';
import signPaymentProviderForCheckout from './signPaymentProviderForCheckout';
import pageView from './pageView';
import reorderAssortmentMedia from './reorderAssortmentMedia';
import removeAssortmentMedia from './removeAssortmentMedia';
import updateAssortmentMediaTexts from './updateAssortmentMediaTexts';

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
