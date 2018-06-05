import { actions } from '../../roles';
import { checkResolver as acl } from '../acl';
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
import addCartProduct from './addCartProduct';
import updateCartItemQuantity from './updateCartItemQuantity';
import removeCartItem from './removeCartItem';
import addCartDiscount from './addCartDiscount';
import removeCartDiscount from './removeCartDiscount';
import removeOrder from './removeOrder';
import updateOrderAddress from './updateOrderAddress';
import updateOrderContact from './updateOrderContact';
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
import captureOrder from './captureOrder';
import setPassword from './setPassword';
import setRoles from './setRoles';
import enrollUser from './enrollUser';
import checkout from './checkout';
import createAssortment from './createAssortment';
import updateAssortment from './updateAssortment';
import removeAssortment from './removeAssortment';
import updateAssortmentTexts from './updateAssortmentTexts';
import addAssortmentProduct from './addAssortmentProduct';
import removeAssortmentProduct from './removeAssortmentProduct';
import reorderAssortmentProducts from './reorderAssortmentProducts';
import addAssortmentLink from './addAssortmentLink';
import removeAssortmentLink from './removeAssortmentLink';
import reorderAssortmentLinks from './reorderAssortmentLinks';

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
  updateProductWarehousing: acl(actions.manageProducts)(updateProductWarehousing),
  updateProductSupply: acl(actions.manageProducts)(updateProductSupply),
  removeProductVariation: acl(actions.manageProducts)(removeProductVariation),
  updateProductVariationTexts: acl(actions.manageProducts)(updateProductVariationTexts),
  removeProductVariationOption: acl(actions.manageProducts)(removeProductVariationOption),
  createProductVariation: acl(actions.manageProducts)(createProductVariation),
  createProductVariationOption: acl(actions.manageProducts)(createProductVariationOption),
  addProductAssignment: acl(actions.manageProducts)(addProductAssignment),
  removeProductAssignment: acl(actions.manageProducts)(removeProductAssignment),

  createCurrency: acl(actions.manageCurrencies)(createCurrency),
  updateCurrency: acl(actions.manageCurrencies)(updateCurrency),
  removeCurrency: acl(actions.manageCurrencies)(removeCurrency),

  captureOrder: acl(actions.captureOrder)(captureOrder),
  addCartProduct: acl(actions.updateCart)(addCartProduct),
  updateCartItemQuantity: acl(actions.updateCart)(updateCartItemQuantity),
  removeCartItem: acl(actions.updateCart)(removeCartItem),
  addCartDiscount: acl(actions.updateCart)(addCartDiscount),
  removeCartDiscount: acl(actions.updateCart)(removeCartDiscount),
  removeOrder: acl(actions.updateOrder)(removeOrder),
  setOrderPaymentProvider: acl(actions.updateOrder)(setOrderPaymentProvider),
  setOrderDeliveryProvider: acl(actions.updateOrder)(setOrderDeliveryProvider),
  updateOrderAddress: acl(actions.updateOrder)(updateOrderAddress),
  updateOrderContact: acl(actions.updateOrder)(updateOrderContact),
  updateOrderDeliveryShipping: acl(actions.updateOrderDelivery)(updateOrderDelivery),
  updateOrderDeliveryPickUp: acl(actions.updateOrderDelivery)(updateOrderDelivery),
  updateOrderPaymentCard: acl(actions.updateOrderPayment)(updateOrderPayment),
  updateOrderPaymentInvoice: acl(actions.updateOrderPayment)(updateOrderPayment),
  updateOrderPaymentPostfinance: acl(actions.updateOrderPayment)(updateOrderPayment),
  updateOrderPaymentPaypal: acl(actions.updateOrderPayment)(updateOrderPayment),
  updateOrderPaymentCrypto: acl(actions.updateOrderPayment)(updateOrderPayment),
  checkout: acl(actions.checkoutCart)(checkout),
  confirmOrder: acl(actions.markOrderConfirmed)(confirmOrder),
  payOrder: acl(actions.markOrderPaid)(payOrder),

  createPaymentProvider: acl(actions.managePaymentProviders)(createPaymentProvider),
  updatePaymentProvider: acl(actions.managePaymentProviders)(updatePaymentProvider),
  removePaymentProvider: acl(actions.managePaymentProviders)(removePaymentProvider),

  createDeliveryProvider: acl(actions.manageDeliveryProviders)(createDeliveryProvider),
  updateDeliveryProvider: acl(actions.manageDeliveryProviders)(updateDeliveryProvider),
  removeDeliveryProvider: acl(actions.manageDeliveryProviders)(removeDeliveryProvider),

  createWarehousingProvider: acl(actions.manageWarehousingProviders)(createWarehousingProvider),
  updateWarehousingProvider: acl(actions.manageWarehousingProviders)(updateWarehousingProvider),
  removeWarehousingProvider: acl(actions.manageWarehousingProviders)(removeWarehousingProvider),

  createAssortment: acl(actions.manageAssortments)(createAssortment),
  updateAssortment: acl(actions.manageAssortments)(updateAssortment),
  removeAssortment: acl(actions.manageAssortments)(removeAssortment),
  updateAssortmentTexts: acl(actions.manageAssortments)(updateAssortmentTexts),
  addAssortmentProduct: acl(actions.manageAssortments)(addAssortmentProduct),
  removeAssortmentProduct: acl(actions.manageAssortments)(removeAssortmentProduct),
  reorderAssortmentProducts: acl(actions.manageAssortments)(reorderAssortmentProducts),
  addAssortmentLink: acl(actions.manageAssortments)(addAssortmentLink),
  removeAssortmentLink: acl(actions.manageAssortments)(removeAssortmentLink),
  reorderAssortmentLinks: acl(actions.manageAssortments)(reorderAssortmentLinks),
};
