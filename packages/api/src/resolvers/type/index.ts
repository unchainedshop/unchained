import { AssortmentTypes as Assortment } from './assortment/assortment-types.ts';
import { AssortmentFilter } from './assortment/assortment-filter-types.ts';
import { AssortmentLink } from './assortment/assortment-link-types.ts';
import { AssortmentMedia } from './assortment/assortment-media-types.ts';
import { AssortmentPathLink } from './assortment/assortment-path-link-types.ts';
import { AssortmentProduct } from './assortment/assortment-product-types.ts';
import { Bookmark } from './bookmark-types.ts';
import { BundleProduct } from './product/product-bundle-types.ts';
import { ConfigurableProduct } from './product/product-configurable-types.ts';
import { Country } from './country-types.ts';
import { Currency } from './currency-types.ts';
import { DeliveryProvider } from './delivery-provider-types.ts';
import { Dimensions } from './dimensions-types.ts';
import { Enrollment } from './enrollment/enrollment-types.ts';
import { EnrollmentDelivery } from './enrollment/enrollment-delivery-types.ts';
import { EnrollmentPayment } from './enrollment/enrollment-payment-types.ts';
import { EnrollmentPeriod } from './enrollment/enrollment-period-types.ts';
import { EnrollmentPlan } from './enrollment/enrollment-plan-tyes.ts';
import { Filter } from './filter/filter-types.ts';
import { FilterOption } from './filter/filter-option-types.ts';
import { Language } from './language-types.ts';
import { LoadedFilter } from './filter/loaded-filter-types.ts';
import { LoadedFilterOption } from './filter/loaded-filter-option-types.ts';
import { Order } from './order/order-types.ts';
import { OrderDelivery } from './order/order-delivery-types.ts';
import { OrderDeliveryDiscount } from './order/order-delivery-discount-types.ts';
import { OrderDeliveryPickUp } from './order/order-delivery-pickup-types.ts';
import { OrderDeliveryShipping } from './order/order-delivery-shipping-types.ts';
import { OrderDiscount } from './order/order-discount-types.ts';
import { OrderDiscountable } from './order/order-discountable-types.ts';
import { OrderGlobalDiscount } from './order/order-global-discount-types.ts';
import { OrderItem } from './order/order-item-types.ts';
import { OrderItemDiscount } from './order/order-item-discount-types.ts';
import { OrderPayment } from './order/order-payment-types.ts';
import { OrderPaymentCard } from './order/order-payment-card-types.ts';
import { OrderPaymentDiscount } from './order/order-payment-discount-types.ts';
import { OrderPaymentGeneric } from './order/order-payment-generic-types.ts';
import { OrderPaymentInvoice } from './order/order-payment-invoice-types.ts';
import { PaymentCredentials } from './payment/payment-credentials-types.ts';
import { PaymentProvider } from './payment/payment-provider-types.ts';
import { PlanProduct } from './product/product-plan-types.ts';
import { Price } from './price-types.ts';
import { Product } from './product/product-types.ts';
import { ProductAssortmentPath } from './product/product-assortment-path-types.ts';
import { ProductBundleItem } from './product/product-bundle-item-types.ts';
import { ProductCatalogPrice } from './product/product-catalog-price-types.ts';
import { ProductDiscount } from './product/product-discount.ts';
import { ProductMedia } from './product/product-media-types.ts';
import { ProductReview } from './product/product-review-types.ts';
import { ProductVariation } from './product/product-variation-types.ts';
import { ProductVariationAssignment } from './product/product-variation-assignment-types.ts';
import { ProductVariationAssignmentVector } from './product/product-variation-assignment-vector.ts';
import { ProductVariationOption } from './product/product-variation-option-types.ts';
import { ConfigurableOrBundleProduct } from './product/product-configurable-or-bundle-product-types.ts';
import { Quotation } from './quotation-types.ts';
import { Shop } from './shop-types.ts';
import { SimpleProduct } from './product/product-simple-types.ts';
import { TokenizedProduct } from './product/product-tokenized-types.ts';
import { User } from './user-types.ts';
import { WebAuthnCredentials } from './webauthn-credentials-types.ts';
import { WarehousingProvider } from './warehousing-provider-types.ts';
import { Work } from './work-types.ts';
import { Event } from './event-types.ts';
import { Media } from './media-types.ts';
import { Token } from './token-types.ts';
import { Web3Address } from './web3-address.ts';
import { LoginMethodResponse } from './login-method-response-types.ts';
import { ProductSearchResult } from './product-search-result-types.ts';
import { OrderStatistics } from './order/order-statistics-types.ts';
import { DeliveryProviderPickUp } from './delivery-provider-pickup-types.ts';
import { DeliveryProviderShipping } from './delivery-provider-shipping-types.ts';

const types = {
  Assortment,
  AssortmentFilter,
  AssortmentLink,
  AssortmentMedia,
  AssortmentPathLink,
  AssortmentProduct,
  Bookmark,
  BundleProduct,
  ConfigurableProduct,
  Country,
  Currency,
  DeliveryProvider,
  DeliveryProviderPickUp,
  DeliveryProviderShipping,
  Dimensions,
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
  ProductSearchResult,
  ConfigurableOrBundleProduct,
  Quotation,
  Shop,
  SimpleProduct,
  TokenizedProduct,
  Token,
  User,
  WebAuthnCredentials,
  WarehousingProvider,
  Work,
  Event,
  Media,
  Web3Address,
  LoginMethodResponse,
  OrderStatistics,
};

export default types;
