import { Order } from '@unchainedshop/core-orders';
import { User } from '@unchainedshop/core-users';
import type { TimestampFields, mongodb } from '@unchainedshop/mongodb';
import { OrderDiscount } from '@unchainedshop/types/orders.discounts.js';
import { OrderPosition } from '@unchainedshop/core-orders';
import type { OrderPrice } from '@unchainedshop/types/orders.pricing.js';
import {
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingDirector,
  IPricingSheet,
  PricingCalculation,
} from '@unchainedshop/types/pricing.js';

export type ProductMedia = {
  _id?: string;
  mediaId: string;
  productId: string;
  sortKey: number;
  tags: Array<string>;
  meta?: any;
} & TimestampFields;

export type ProductMediaText = {
  _id?: string;
  productMediaId: string;
  locale?: string;
  title?: string;
  subtitle?: string;
} & TimestampFields;

export enum ProductContractStandard {
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
}

export interface ProductConfiguration {
  key: string;
  value: string;
}

export interface ProductBundleItem {
  productId: string;
  quantity: number;
  configuration: Array<ProductConfiguration>;
}

export interface ProductPrice {
  _id?: string;
  isTaxable?: boolean;
  isNetPrice?: boolean;
  countryCode?: string;
  currencyCode: string;
  amount: number;
  maxQuantity?: number;
}

export interface ProductPriceRange {
  _id: string;
  minPrice: ProductPrice;
  maxPrice: ProductPrice;
}

export interface ProductCommerce {
  salesUnit?: string;
  salesQuantityPerUnit?: string;
  defaultOrderQuantity?: number;
  pricing: Array<ProductPrice>;
}

export interface ProductTokenization {
  contractAddress: string;
  contractStandard: ProductContractStandard;
  tokenId: string;
  supply: number;
  ercMetadataProperties?: Record<string, any>;
}

export interface ProductPlan {
  billingInterval?: string;
  billingIntervalCount?: number;
  usageCalculationType?: string;
  trialInterval?: string;
  trialIntervalCount?: number;
}

export interface ProductContractConfiguration {
  tokenId?: string;
  supply?: number;
  ercMetadataProperties?: Record<string, any>;
}

export interface ProductAssignment {
  vector: any;
  productId: string;
}

export interface ProductProxy {
  assignments: Array<ProductAssignment>;
}

export interface ProductSupply {
  weightInGram?: number;
  heightInMillimeters?: number;
  lengthInMillimeters?: number;
  widthInMillimeters?: number;
}

export interface ProductWarehousing {
  baseUnit?: string;
  sku?: string;
}

export type Product = {
  _id?: string;
  bundleItems: Array<ProductBundleItem>;
  commerce?: ProductCommerce;
  meta?: any;
  plan: ProductPlan;
  proxy: ProductProxy;
  published?: Date;
  sequence: number;
  slugs: Array<string>;
  status?: string;
  supply: ProductSupply;
  tags?: Array<string>;
  type: string;
  warehousing?: ProductWarehousing;
  tokenization?: ProductTokenization;
} & TimestampFields;

export type ProductText = {
  _id?: string;
  productId: string;
  description?: string;
  locale: string;
  slug?: string;
  subtitle?: string;
  title?: string;
  brand?: string;
  vendor?: string;
  labels?: Array<string>;
} & TimestampFields;

export type ProductDiscount = {
  _id?: string;
  productId: string;
  code: string;
  total?: OrderPrice;
  discountKey?: string;
  context?: any;
};

export type ProductQuery = {
  queryString?: string;
  includeDrafts?: boolean;
  productIds?: Array<string>;
  productSelector?: mongodb.Filter<Product>;
  slugs?: Array<string>;
  tags?: Array<string>;
};

export enum ProductPricingRowCategory {
  Item = 'ITEM',
  Discount = 'DISCOUNT',
  Tax = 'TAX',
}

export interface ProductPricingCalculation extends PricingCalculation {
  discountId?: string;
  isTaxable: boolean;
  isNetPrice: boolean;
  rate?: number;
}

export interface ProductPricingAdapterContext extends BasePricingAdapterContext {
  country: string;
  currency: string;
  product: Product;
  quantity: number;
  configuration: Array<ProductConfiguration>;
}

export type ProductPricingContext =
  | {
      country?: string;
      currency?: string;
      discounts?: Array<OrderDiscount>;
      order?: Order;
      product?: Product;
      quantity?: number;
      configuration: Array<ProductConfiguration>;
      user?: User;
    }
  | {
      item: OrderPosition;
    };

export interface IProductPricingSheet extends IPricingSheet<ProductPricingCalculation> {
  addItem: (params: Omit<ProductPricingCalculation, 'category' | 'discountId'>) => void;

  addTax: (params: {
    amount: number;
    rate: number;
    baseCategory?: string;
    discountId?: string;
    meta?: any;
  }) => void;

  addDiscount: (params: {
    amount: number;
    isTaxable: boolean;
    isNetPrice: boolean;
    discountId: string;
    meta?: any;
  }) => void;

  unitPrice: (params?: { useNetPrice: boolean }) => {
    amount: number;
    currency: string;
  };
}

export type IProductPricingAdapter<DiscountConfiguration = unknown> = IPricingAdapter<
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  IProductPricingSheet,
  DiscountConfiguration
>;

export type IProductPricingDirector<DiscountConfiguration = unknown> = IPricingDirector<
  ProductPricingContext,
  ProductPricingCalculation,
  ProductPricingAdapterContext,
  IProductPricingSheet,
  IProductPricingAdapter<DiscountConfiguration>
>;

export type ProductPriceRate = {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  expiresAt: Date;
  timestamp: Date;
};
