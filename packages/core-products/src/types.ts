import { Order } from '@unchainedshop/core-orders';
import { User } from '@unchainedshop/core-users';
import { TimestampFields, mongodb } from '@unchainedshop/mongodb';
import { OrderDiscount } from '@unchainedshop/core-orders';
import { OrderPosition } from '@unchainedshop/core-orders';
import { OrderPrice } from '@unchainedshop/core-orders';
import { UnchainedCore } from '@unchainedshop/core';
import {
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingDirector,
  IPricingSheet,
  PricingCalculation,
} from '@unchainedshop/utils';

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

export enum ProductReviewVoteType {
  UPVOTE = 'UPVOTE',
  DOWNVOTE = 'DOWNVOTE',
  REPORT = 'REPORT',
}

export interface ProductVote {
  meta?: any;
  timestamp?: Date;
  type: ProductReviewVoteType;
  userId?: string;
}

export type ProductReview = {
  _id?: string;
  productId: string;
  authorId: string;
  rating: number;
  title?: string;
  review?: string;
  meta?: any;
  votes: Array<ProductVote>;
} & TimestampFields;

export type ProductReviewQuery = {
  productId?: string;
  authorId?: string;
  queryString?: string;
  created?: { end?: Date; start?: Date };
  updated?: { end?: Date; start?: Date };
};

export enum ProductVariationType {
  COLOR = 'COLOR',
  TEXT = 'TEXT',
}

export type ProductVariation = {
  _id?: string;
  key?: string;
  tags?: string[];
  options: Array<string>;
  productId: string;
  type?: string;
} & TimestampFields;

export type ProductVariationText = {
  _id?: string;
  locale: string;
  productVariationId: string;
  productVariationOptionValue?: string;
  subtitle?: string;
  title?: string;
} & TimestampFields;

export type ProductVariationOption = {
  _id: string;
  texts: ProductVariationText;
  value: string;
};

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

export interface ProductPricingAdapterContext extends BasePricingAdapterContext, UnchainedCore {
  country: string;
  currency: string;
  product: Product;
  quantity: number;
  configuration: Array<ProductConfiguration>;
  order?: Order;
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
  IProductPricingAdapter<DiscountConfiguration>,
  UnchainedCore
>;

export type ProductPriceRate = {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  expiresAt: Date;
  timestamp: Date;
};
