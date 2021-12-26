import { Assortment } from './assortment-types';
import { AssortmentMedia } from './assortment-media-types';
import { AssortmentPathLink } from './assortment-path-link-types';
import { ConfigurableProduct } from './product-configurable-types';
import { Country } from './country-types';
import { DeliveryProvider } from './delivery-provider-types';
import { Language } from './language-types';
import { PaymentCredentials } from './payment-credentials-types';
import { PaymentProvider } from './payment-provider-types';
import { PlanProduct } from './product-plan-types';
import { Product } from './product-types';
import { ProductAssortmentPath } from './product-assortment-path-types';
import { ProductBundleItem } from './product-bundle-item-types';
import { ProductCatalogPrice } from './product-catalog-price-types';
import { ProductDiscount } from './product-discount';
import { ProductMedia } from './product-media-types';
import { ProductVariation } from './product-variation-types';
import { ProductVariationAssignment } from './product-variation-assignment-types';
import { ProductVariationAssignmentVector } from './product-variation-assignment-vector';
import { ProductVariationOption } from './product-variation-option-types';
import { Shop } from './shop-types';
import { SimpleProduct } from './product-simple-types';
import { User } from './user-types';
import { WarehousingProvider } from './warehousing-provider-types';
import Bookmark from './bookmark-types';
import { BundleProduct } from './product-bundle-types';
import Color from './color';
import Dimensions from './dimensions';
import Dispatch from './dispatch';
import Enrollment from './enrollment';
import EnrollmentDelivery from './enrollment-delivery';
import EnrollmentPayment from './enrollment-payment';
import EnrollmentPeriod from './enrollment-period';
import EnrollmentPlan from './enrollment-plan';
import Filter from './filter';
import FilterOption from './filter-option';
import LoadedFilter from './loaded-filter';
import LoadedFilterOption from './loaded-filter-option';
import LoginMethodResponse from './login-method-response';
import Order from './order';
import OrderDelivery from './order-delivery';
import OrderDeliveryDiscount from './order-delivery-discount';
import OrderDeliveryPickUp from './order-delivery-pickup';
import OrderDeliveryShipping from './order-delivery-shipping';
import OrderDiscount from './order-discount';
import OrderDiscountable from './order-discountable';
import OrderGlobalDiscount from './order-global-discount';
import OrderItem from './order-item';
import OrderItemDiscount from './order-item-discount';
import OrderPayment from './order-payment';
import OrderPaymentCard from './order-payment-card';
import OrderPaymentDiscount from './order-payment-discount';
import OrderPaymentGeneric from './order-payment-generic';
import OrderPaymentInvoice from './order-payment-invoice';
import Price from './price';
import Quotation from './quotation';
import Stock from './stock';

export default {
  Assortment,
  AssortmentMedia,
  AssortmentPathLink,
  Bookmark,
  BundleProduct,
  Color,
  ConfigurableProduct,
  Country,
  DeliveryProvider,
  Dimensions,
  Dispatch,
  Enrollment,
  EnrollmentDelivery,
  EnrollmentPayment,
  EnrollmentPeriod,
  EnrollmentPlan,
  Filter,
  FilterOption,
  Language,
  LoadedFilter,
  LoadedFilterOption,
  LoginMethodResponse,
  Order,
  OrderDelivery,
  OrderDeliveryDiscount,
  OrderDeliveryPickUp,
  OrderDeliveryShipping,
  OrderDiscount,
  OrderDiscountable,
  OrderGlobalDiscount,
  OrderItem,
  OrderItemDiscount,
  OrderPayment,
  OrderPaymentCard,
  OrderPaymentDiscount,
  OrderPaymentGeneric,
  OrderPaymentInvoice,
  PaymentCredentials,
  PaymentProvider,
  PlanProduct,
  Price,
  Product,
  ProductAssortmentPath,
  ProductBundleItem,
  ProductCatalogPrice,
  ProductDiscount,
  ProductMedia,
  ProductVariation,
  ProductVariationAssignment,
  ProductVariationAssignmentVector,
  ProductVariationOption,
  Quotation,
  Shop,
  SimpleProduct,
  Stock,
  User,
  WarehousingProvider,
};
