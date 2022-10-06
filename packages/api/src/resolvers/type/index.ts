import { Assortment } from './assortment/assortment-types';
import { AssortmentFilter } from './assortment/assortment-filter-types';
import { AssortmentLink } from './assortment/assortment-link-types';
import { AssortmentMedia } from './assortment/assortment-media-types';
import { AssortmentPathLink } from './assortment/assortment-path-link-types';
import { AssortmentProduct } from './assortment/assortment-product-types';
import { Bookmark } from './bookmark-types';
import { BundleProduct } from './product/product-bundle-types';
import { Color } from './color-types';
import { ConfigurableProduct } from './product/product-configurable-types';
import { Country } from './country-types';
import { Currency } from './currency-types';
import { DeliveryProvider } from './delivery-provider-types';
import { Dimensions } from './dimensions-types';
import { Dispatch } from './dispatch-types';
import { Enrollment } from './enrollment/enrollment-types';
import { EnrollmentDelivery } from './enrollment/enrollment-delivery-types';
import { EnrollmentPayment } from './enrollment/enrollment-payment-types';
import { EnrollmentPeriod } from './enrollment/enrollment-period-types';
import { EnrollmentPlan } from './enrollment/enrollment-plan-tyes';
import { Filter } from './filter/filter-types';
import { FilterOption } from './filter/filter-option-types';
import { Language } from './language-types';
import { LoadedFilter } from './filter/loaded-filter-types';
import { LoadedFilterOption } from './filter/loaded-filter-option-types';
import { LoginMethodResponse } from './login-method-response-types';
import { Order } from './order/order-types';
import { OrderDelivery } from './order/order-delivery-types';
import { OrderDeliveryDiscount } from './order/order-delivery-discount-types';
import { OrderDeliveryPickUp } from './order/order-delivery-pickup-types';
import { OrderDeliveryShipping } from './order/order-delivery-shipping-types';
import { OrderDiscount } from './order/order-discount-types';
import { OrderDiscountable } from './order/order-discountable-types';
import { OrderGlobalDiscount } from './order/order-global-discount-types';
import { OrderItem } from './order/order-item-types';
import { OrderItemDiscount } from './order/order-item-discount-types';
import { OrderPayment } from './order/order-payment-types';
import { OrderPaymentCard } from './order/order-payment-card-types';
import { OrderPaymentDiscount } from './order/order-payment-discount-types';
import { OrderPaymentGeneric } from './order/order-payment-generic-types';
import { OrderPaymentInvoice } from './order/order-payment-invoice-types';
import { PaymentCredentials } from './payment/payment-credentials-types';
import { PaymentProvider } from './payment/payment-provider-types';
import { PlanProduct } from './product/product-plan-types';
import { Price } from './price-types';
import { Product } from './product/product-types';
import { ProductAssortmentPath } from './product/product-assortment-path-types';
import { ProductBundleItem } from './product/product-bundle-item-types';
import { ProductCatalogPrice } from './product/product-catalog-price-types';
import { ProductDiscount } from './product/product-discount';
import { ProductMedia } from './product/product-media-types';
import { ProductReview } from './product/product-review-types';
import { ProductVariation } from './product/product-variation-types';
import { ProductVariationAssignment } from './product/product-variation-assignment-types';
import { ProductVariationAssignmentVector } from './product/product-variation-assignment-vector';
import { ProductVariationOption } from './product/product-variation-option-types';
import { Quotation } from './quotation-types';
import { Shop } from './shop-types';
import { SimpleProduct } from './product/product-simple-types';
import { TokenizedProduct } from './product/product-tokenized-types';
import { Stock } from './stock-types';
import { User } from './user-types';
import { WebAuthnCredentials } from './webauthn-credentials-types';
import { WarehousingProvider } from './warehousing-provider-types';
import { Work } from './work-types';
import { Event } from './event-types';
import { Media } from './media-types';
import { Token } from './token-types';

const types = {
  Assortment,
  AssortmentFilter,
  AssortmentLink,
  AssortmentMedia,
  AssortmentPathLink,
  AssortmentProduct,
  Bookmark,
  BundleProduct,
  Color,
  ConfigurableProduct,
  Country,
  Currency,
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
  ProductReview,
  ProductVariation,
  ProductVariationAssignment,
  ProductVariationAssignmentVector,
  ProductVariationOption,
  Quotation,
  Shop,
  SimpleProduct,
  TokenizedProduct,
  Token,
  Stock,
  User,
  WebAuthnCredentials,
  WarehousingProvider,
  Work,
  Event,
  Media,
};

export default types;
