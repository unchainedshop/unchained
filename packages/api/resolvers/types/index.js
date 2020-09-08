import User from './user';
import LoginMethodResponse from './login-method-response';
import Product from './product';
import Color from './color';
import Money from './money';
import Media from './media';
import SimpleProduct from './simple-product';
import ConfigurableProduct from './configurable-product';
import PlanProduct from './plan-product';
import BundleProduct from './bundle-product';
import ProductBundleItem from './product-bundle-item';
import ProductMedia from './product-media';
import ProductPrice from './product-price';
import Dispatch from './dispatch';
import Stock from './stock';
import ProductDiscount from './product-discount';
import ProductVariationOption from './product-variation-option';
import ProductVariation from './product-variation';
import ProductVariationAssignment from './product-variation-assignment';
import ProductVariationAssignmentVector from './product-variation-assignment-vector';
import ProductAssortmentPath from './product-assortment-path';
import Order from './order';
import OrderDiscount from './order-discount';
import OrderDiscountable from './order-discountable';
import OrderGlobalDiscount from './order-global-discount';
import OrderItem from './order-item';
import OrderItemDiscount from './order-item-discount';
import OrderDelivery from './order-delivery';
import OrderDeliveryDiscount from './order-delivery-discount';
import OrderDeliveryShipping from './order-delivery-shipping';
import OrderDeliveryPickUp from './order-delivery-pickup';
import OrderPayment from './order-payment';
import OrderPaymentDiscount from './order-payment-discount';
import OrderPaymentCard from './order-payment-card';
import OrderPaymentGeneric from './order-payment-generic';
import OrderPaymentInvoice from './order-payment-invoice';
import PaymentProvider from './payment-provider';
import DeliveryProvider from './delivery-provider';
import WarehousingProvider from './warehousing-provider';
import Dimensions from './dimensions';
import Language from './language';
import Shop from './shop';
import Country from './country';
import Assortment from './assortment';
import AssortmentPathLink from './assortment-path-link';
import Filter from './filter';
import FilterOption from './filter-option';
import LoadedFilter from './loaded-filter';
import LoadedFilterOption from './loaded-filter-option';
import SearchResult from './product-search-result';
import AssortmentSearchResult from './assortment-search-result';
import Quotation from './quotation';
import DeliveryFee from './delivery-fee';
import SubscriptionPayment from './subscription-payment';
import SubscriptionDelivery from './subscription-delivery';
import SubscriptionPeriod from './subscription-period';
import SubscriptionPlan from './subscription-plan';
import Subscription from './subscription';

export default {
  User,
  LoginMethodResponse,
  Shop,
  Country,
  Language,
  Money,
  Color,
  Media,
  Order,
  PaymentProvider,
  DeliveryProvider,
  WarehousingProvider,
  Dimensions,
  Dispatch,
  Stock,
  OrderDiscount,
  OrderDiscountable,
  OrderGlobalDiscount,
  OrderItem,
  OrderItemDiscount,
  OrderDelivery,
  OrderDeliveryDiscount,
  OrderDeliveryShipping,
  OrderDeliveryPickUp,
  OrderPayment,
  OrderPaymentDiscount,
  OrderPaymentInvoice,
  OrderPaymentGeneric,
  OrderPaymentCard,
  Product,
  ProductPrice,
  ProductDiscount,
  ProductMedia,
  ProductVariation,
  ProductVariationOption,
  ProductVariationAssignment,
  ProductVariationAssignmentVector,
  ProductAssortmentPath,
  ProductBundleItem,
  SimpleProduct,
  PlanProduct,
  ConfigurableProduct,
  BundleProduct,
  Assortment,
  AssortmentPathLink,
  Filter,
  FilterOption,
  LoadedFilter,
  LoadedFilterOption,
  Quotation,
  SearchResult,
  ProductSearchResult: SearchResult,
  AssortmentSearchResult,
  DeliveryFee,
  SubscriptionPayment,
  SubscriptionDelivery,
  SubscriptionPeriod,
  SubscriptionPlan,
  Subscription,
};
