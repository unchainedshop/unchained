import { actions } from '../../roles';
import { checkResolver as acl } from '../../acl';
import Accounts from './accounts';
import updateEmail from './updateEmail';
import updateUserAvatar from './updateUserAvatar';
import updateUserProfile from './updateUserProfile';
import updateUserTags from './updateUserTags';
import createLanguage from './createLanguage';
import updateLanguage from './updateLanguage';
import removeLanguage from './removeLanguage';
import createCountry from './createCountry';
import updateCountry from './updateCountry';
import removeCountry from './removeCountry';
import createCurrency from './createCurrency';
import updateCurrency from './updateCurrency';
import removeCurrency from './removeCurrency';
import setBaseLanguage from './setBaseLanguage';
import setBaseCountry from './setBaseCountry';
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
import addProductAssignment from './addProductAssignment';
import removeProductAssignment from './removeProductAssignment';
import createCart from './createCart';
import addCartProduct from './addCartProduct';
import addMultipleCartProducts from './addMultipleCartProducts';
import addCartDiscount from './addCartDiscount';
import addCartQuotation from './addCartQuotation';
import updateCart from './updateCart';
import emptyCart from './emptyCart';
import updateCartItemQuantity from './updateCartItemQuantity';
import updateCartItem from './updateCartItem';

import removeCartItem from './removeCartItem';
import removeCartDiscount from './removeCartDiscount';
import removeOrder from './removeOrder';
import setOrderPaymentProvider from './setOrderPaymentProvider';
import setOrderDeliveryProvider from './setOrderDeliveryProvider';
import updateOrderDelivery from './updateOrderDelivery';
import updateOrderPayment from './updateOrderPayment';
import confirmOrder from './confirmOrder';
import payOrder from './payOrder';
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
import requestQuotation from './requestQuotation';
import rejectQuotation from './rejectQuotation';
import verifyQuotation from './verifyQuotation';
import makeQuotationProposal from './makeQuotationProposal';

export default {
  ...Accounts,

  updateEmail: acl(actions.updateUser)(updateEmail),
  updateUserAvatar: acl(actions.updateUser)(updateUserAvatar),
  updateUserProfile: acl(actions.updateUser)(updateUserProfile),
  updateUserTags: acl(actions.manageUsers)(updateUserTags),
  setPassword: acl(actions.manageUsers)(setPassword),
  enrollUser: acl(actions.manageUsers)(enrollUser),
  setRoles: acl(actions.manageUsers)(setRoles),

  createLanguage: acl(actions.manageLanguages)(createLanguage),
  updateLanguage: acl(actions.manageLanguages)(updateLanguage),
  setBaseLanguage: acl(actions.manageLanguages)(setBaseLanguage),
  removeLanguage: acl(actions.manageLanguages)(removeLanguage),

  createCountry: acl(actions.manageCountries)(createCountry),
  updateCountry: acl(actions.manageCountries)(updateCountry),
  setBaseCountry: acl(actions.manageCountries)(setBaseCountry),
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
  updateCartItemQuantity: acl(actions.updateOrderItem)(updateCartItemQuantity),
  updateCartItem: acl(actions.updateOrderItem)(updateCartItem),
  removeCartItem: acl(actions.updateOrderItem)(removeCartItem),
  removeCartDiscount: acl(actions.updateOrderDiscount)(removeCartDiscount),
  setOrderPaymentProvider: acl(actions.updateOrder)(setOrderPaymentProvider),
  setOrderDeliveryProvider: acl(actions.updateOrder)(setOrderDeliveryProvider),
  updateOrderDeliveryShipping: acl(actions.updateOrderDelivery)(
    updateOrderDelivery
  ),
  updateOrderDeliveryPickUp: acl(actions.updateOrderDelivery)(
    updateOrderDelivery
  ),
  updateOrderPaymentCard: acl(actions.updateOrderPayment)(updateOrderPayment),
  updateOrderPaymentInvoice: acl(actions.updateOrderPayment)(
    updateOrderPayment
  ),
  updateOrderPaymentPostfinance: acl(actions.updateOrderPayment)(
    updateOrderPayment
  ),
  updateOrderPaymentPaypal: acl(actions.updateOrderPayment)(updateOrderPayment),
  updateOrderPaymentCrypto: acl(actions.updateOrderPayment)(updateOrderPayment),
  removeOrder: acl(actions.updateOrder)(removeOrder),
  confirmOrder: acl(actions.markOrderConfirmed)(confirmOrder),
  payOrder: acl(actions.markOrderPaid)(payOrder),

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
  updateAssortment: acl(actions.manageAssortments)(updateAssortment),
  setBaseAssortment: acl(actions.manageAssortments)(setBaseAssortment),
  removeAssortment: acl(actions.manageAssortments)(removeAssortment),
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

  requestQuotation: acl(actions.requestQuotation)(requestQuotation),
  rejectQuotation: acl(actions.answerQuotation)(rejectQuotation),
  verifyQuotation: acl(actions.manageQuotations)(verifyQuotation),
  makeQuotationProposal: acl(actions.manageQuotations)(makeQuotationProposal)
};
