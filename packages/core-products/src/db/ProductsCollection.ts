import { mongodb, buildDbIndexes, TimestampFields } from '@unchainedshop/mongodb';
import { Price } from '@unchainedshop/utils';

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

export enum ProductTypes {
  SimpleProduct = 'SIMPLE_PRODUCT',
  ConfigurableProduct = 'CONFIGURABLE_PRODUCT',
  BundleProduct = 'BUNDLE_PRODUCT',
  PlanProduct = 'PLAN_PRODUCT',
  TokenizedProduct = 'TOKENIZED_PRODUCT',
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

export interface ProductPrice extends Price {
  isTaxable?: boolean;
  isNetPrice?: boolean;
  countryCode?: string;
  maxQuantity?: number;
}

export interface ProductPriceRange {
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

export const ProductsCollection = async (db: mongodb.Db) => {
  const Products = db.collection<Product>('products');
  const ProductTexts = db.collection<ProductText>('product_texts');

  // Product Indexes
  await buildDbIndexes(Products, [
    { index: { sequence: 1 } },
    { index: { slugs: 1 } },
    { index: { status: 1 } },
    { index: { tags: 1 } },
    { index: { 'warehousing.sku': 1 } },
    // {
    //   index: { 'warehousing.sku': 'text', slugs: 'text' },
    //   options: {
    //     name: 'products_fulltext_search',
    //   },
    // } as any,
  ]);

  // ProductTexts indexes
  await buildDbIndexes(ProductTexts, [
    { index: { productId: 1 } },
    { index: { locale: 1 } },
    { index: { slug: 1 } },
    { index: { locale: 1, productId: 1 } },
    // {
    //   index: { title: 'text', subtitle: 'text', vendor: 'text', brand: 'text' },
    //   options: {
    //     weights: {
    //       title: 8,
    //       subtitle: 6,
    //       vendor: 5,
    //       brand: 4,
    //     },
    //     name: 'product_texts_fulltext_search',
    //   },
    // },
  ]);

  return {
    Products,
    ProductTexts,
  };
};
