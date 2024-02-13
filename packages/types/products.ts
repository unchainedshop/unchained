import type { FindOptions, UpdateFilter, Filter } from 'mongodb';

import { Context, SortOption } from './api.js';
import { AssortmentPathLink, AssortmentProduct } from './assortments.js';
import { TimestampFields } from './common.js';
import { UnchainedCore } from './core.js';
import { Country } from './countries.js';
import { Currency } from './currencies.js';
import { DeliveryProvider, DeliveryProviderType } from './delivery.js';
import { IDiscountAdapter } from './discount.js';
import { OrderPosition } from './orders.positions.js';
import { OrderPrice } from './orders.pricing.js';
import { ProductMedia, ProductMediaModule } from './products.media.js';
import {
  IProductPricingSheet,
  ProductPriceRate,
  ProductPricingCalculation,
  ProductPricingContext,
} from './products.pricing.js';
import { ProductReview, ProductReviewsModule } from './products.reviews.js';
import { ProductVariationsModule, ProductVariation } from './products.variations.js';
import { WarehousingProvider } from './warehousing.js';

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

export enum ProductType {
  SimpleProduct = 'SIMPLE_PRODUCT',
  ConfigurableProduct = 'CONFIGURABLE_PRODUCT',
  BundleProduct = 'BUNDLE_PRODUCT',
  PlanProduct = 'PLAN_PRODUCT',
  TokenizedProduct = 'TOKENIZED_PRODUCT',
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

/*
 * Module
 */

export type ProductQuery = {
  queryString?: string;
  includeDrafts?: boolean;
  productIds?: Array<string>;
  productSelector?: Filter<Product>;
  slugs?: Array<string>;
  tags?: Array<string>;
};

export type ProductsModule = {
  // Queries
  findProduct: (params: { productId?: string; slug?: string; sku?: string }) => Promise<Product>;

  findProducts: (
    params: ProductQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
    options?: FindOptions,
  ) => Promise<Array<Product>>;

  count: (query: ProductQuery) => Promise<number>;
  productExists: (params: { productId?: string; slug?: string }) => Promise<boolean>;

  // Transformations
  interface: (productDiscount: ProductDiscount) => IDiscountAdapter<unknown>;

  isActive: (product: Product) => boolean;
  isDraft: (product: Product) => boolean;

  normalizedStatus: (product: Product) => ProductStatus;

  pricingSheet: (params: {
    calculation: Array<ProductPricingCalculation>;
    currency: string;
    quantity: number;
  }) => IProductPricingSheet;

  proxyAssignments: (
    product: Product,
    options: { includeInactive?: boolean },
  ) => Promise<Array<{ assignment: ProductAssignment; product: Product }>>;

  proxyProducts: (
    product: Product,
    vectors: Array<ProductConfiguration>,
    options: { includeInactive?: boolean },
  ) => Promise<Array<Product>>;

  resolveOrderableProduct: (
    product: Product,
    params: { configuration?: Array<ProductConfiguration> },
    unchainedAPI: UnchainedCore,
  ) => Promise<Product>;

  prices: {
    price: (
      product: Product,
      params: { country: string; currency?: string; quantity?: number },
    ) => Promise<ProductPrice>;

    userPrice: (
      prodct: Product,
      params: {
        userId: string;
        country: string;
        currency: string;
        quantity?: number;
        useNetPrice?: boolean;
        configuration?: Array<ProductConfiguration>;
      },
      unchainedAPI: UnchainedCore,
    ) => Promise<ProductPrice>;

    catalogPrices: (prodct: Product) => Array<ProductPrice>;
    catalogPricesLeveled: (
      product: Product,
      params: { currency: string; country: string },
    ) => Promise<
      Array<{
        minQuantity: number;
        maxQuantity: number;
        price: ProductPrice;
      }>
    >;
    catalogPriceRange: (
      product: Product,
      params: {
        country: string;
        currency: string;
        includeInactive?: boolean;
        quantity?: number;
        vectors: Array<ProductConfiguration>;
      },
    ) => Promise<ProductPriceRange>;

    simulatedPriceRange: (
      prodct: Product,
      params: {
        userId: string;
        country: string;
        currency: string;
        includeInactive?: boolean;
        quantity?: number;
        useNetPrice?: boolean;
        vectors: Array<ProductConfiguration>;
      },
      unchainedAPI: UnchainedCore,
    ) => Promise<ProductPriceRange>;

    rates: {
      getRate(
        baseCurrency: Currency,
        quoteCurrency: Currency,
        referenceDate?: Date,
      ): Promise<{ rate: number; expiresAt: Date } | null>;
      getRateRange(
        baseCurrency: Currency,
        quoteCurrency: Currency,
        referenceDate?: Date,
      ): Promise<{ min: number; max: number } | null>;
      updateRates(rates: Array<ProductPriceRate>): Promise<boolean>;
    };
  };

  // Product adapter

  calculate: (
    pricingContext: ProductPricingContext & { item: OrderPosition },
    unchainedAPI: UnchainedCore,
  ) => Promise<Array<ProductPricingCalculation>>;

  // Mutations
  create: (
    doc: Product & { title: string; locale: string },
    options?: { autopublish?: boolean },
  ) => Promise<Product>;

  delete: (productId: string) => Promise<number>;
  firstActiveProductProxy: (productId: string) => Promise<Product>;
  firstActiveProductBundle: (productId: string) => Promise<Product>;
  deleteProductPermanently: (
    params: { productId: string },
    options?: { keepReviews: boolean },
  ) => Promise<number>;

  update: (productId: string, doc: UpdateFilter<Product>) => Promise<string>;

  publish: (product: Product) => Promise<boolean>;
  unpublish: (product: Product) => Promise<boolean>;

  /*
   * Product bundle items
   */

  bundleItems: {
    addBundleItem: (productId: string, doc: ProductBundleItem) => Promise<string>;
    removeBundleItem: (productId: string, index: number) => Promise<ProductBundleItem>;
  };

  /*
   * Product assignments
   */

  assignments: {
    addProxyAssignment: (
      productId: string,
      params: { proxyId: string; vectors: Array<ProductConfiguration> },
    ) => Promise<string>;
    removeAssignment: (
      productId: string,
      params: { vectors: Array<ProductConfiguration> },
    ) => Promise<number>;
  };

  /*
   * Product sub entities (Media, Variations & Reviews)
   */
  media: ProductMediaModule;
  reviews: ProductReviewsModule;
  variations: ProductVariationsModule;

  /*
   * Product search
   */

  search: {
    buildActiveStatusFilter: () => Filter<Product>;
    buildActiveDraftStatusFilter: () => Filter<Product>;
    countFilteredProducts: (params: {
      productIds: Array<string>;
      productSelector: Filter<Product>;
    }) => Promise<number>;
    findFilteredProducts: (params: {
      limit?: number;
      offset?: number;
      productIds: Array<string>;
      productSelector: Filter<Product>;
      sort?: FindOptions['sort'];
    }) => Promise<Array<Product>>;
  };

  /*
   * Product texts
   */

  texts: {
    // Queries
    findTexts: (query: Filter<ProductText>, options?: FindOptions) => Promise<Array<ProductText>>;

    findLocalizedText: (params: { productId: string; locale?: string }) => Promise<ProductText>;
    searchTexts: ({ searchText }: { searchText: string }) => Promise<Array<string>>;

    // Mutations
    updateTexts: (
      productId: string,
      texts: Array<Omit<ProductText, 'productId'>>,
    ) => Promise<Array<ProductText>>;

    makeSlug: (data: { slug?: string; title: string; productId: string }) => Promise<string>;

    deleteMany: ({
      productId,
    }: {
      productId?: string;
      excludedProductIds?: string[];
    }) => Promise<number>;
  };
};

/*
 * Services
 */

export type RemoveProductService = (
  params: { productId: string },
  unchainedAPI: UnchainedCore,
) => Promise<boolean>;

export interface ProductServices {
  removeProduct: RemoveProductService;
}

/*
 * API Types
 */

export type HelperType<P, T> = (product: Product, params: P, context: Context) => T;

export interface ProductHelperTypes {
  __resolveType: HelperType<never, string>;

  assortmentPaths: HelperType<
    { forceLocale?: string },
    Promise<Array<{ links: Array<AssortmentPathLink> }>>
  >;

  media: HelperType<
    {
      limit: number;
      offset: number;
      tags?: Array<string>;
    },
    Promise<Array<ProductMedia>>
  >;

  reviews: HelperType<
    {
      queryString?: string;
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
    Promise<Array<ProductReview>>
  >;

  reviewsCount: HelperType<
    {
      queryString?: string;
    },
    Promise<number>
  >;

  siblings: HelperType<
    {
      assortmentId?: string;
      limit: number;
      offset: number;
      includeInactive: boolean;
    },
    Promise<Array<Product>>
  >;

  status: HelperType<never, string>;

  texts: HelperType<{ forceLocale?: string }, Promise<ProductText>>;
}

export interface BundleProductHelperTypes extends ProductHelperTypes {
  bundleItems: HelperType<never, Array<ProductBundleItem>>;
}

export interface ConfigurableProductHelperTypes extends ProductHelperTypes {
  assignments: HelperType<
    { includeInactive: boolean },
    Promise<Array<{ assignment: ProductAssignment; product: Product }>>
  >;
  products: HelperType<
    { vectors: Array<ProductConfiguration>; includeInactive: boolean },
    Promise<Array<Product>>
  >;
  variations: HelperType<{ limit: number; offset: number }, Promise<Array<ProductVariation>>>;
  catalogPriceRange: HelperType<
    {
      currency?: string;
      includeInactive: boolean;
      quantity: number;
      vectors: Array<ProductConfiguration>;
    },
    Promise<ProductPriceRange>
  >;
  simulatedPriceRange: HelperType<
    {
      currency?: string;
      includeInactive: boolean;
      quantity?: number;
      vectors: Array<ProductConfiguration>;
      useNetPrice: boolean;
    },
    Promise<ProductPriceRange>
  >;
}

export interface PlanProductHelperTypes extends ProductHelperTypes {
  catalogPrice: HelperType<{ quantity?: number; currency?: string }, Promise<ProductPrice>>;

  leveledCatalogPrices: HelperType<
    { currency?: string },
    Promise<
      Array<{
        minQuantity: number;
        maxQuantity: number;
        price: ProductPrice;
      }>
    >
  >;

  simulatedPrice: HelperType<
    { quantity?: number; currency?: string; useNetPrice?: boolean },
    Promise<ProductPrice>
  >;

  salesUnit: HelperType<never, string>;
  salesQuantityPerUnit: HelperType<never, string>;
  defaultOrderQuantity: HelperType<never, number>;
}

export interface TokenizedProductHelperTypes extends PlanProductHelperTypes {
  simulatedStocks: HelperType<
    {
      referenceDate: Date;
    },
    Promise<
      Array<{
        _id: string;
        deliveryProvider?: DeliveryProvider;
        warehousingProvider?: WarehousingProvider;
        quantity?: number;
      }>
    >
  >;

  contractAddress: HelperType<never, string>;
  contractStandard: HelperType<never, ProductContractStandard>;
  contractConfiguration: HelperType<never, ProductContractConfiguration>;
}

export interface SimpleProductHelperTypes extends PlanProductHelperTypes {
  simulatedDispatches: HelperType<
    {
      referenceDate: Date;
      quantity: number;
      deliveryProviderType: DeliveryProviderType;
    },
    Promise<
      Array<{
        _id: string;
        deliveryProvider?: DeliveryProvider;
        warehousingProvider?: WarehousingProvider;
        shipping?: Date;
        earliestDelivery?: Date;
      }>
    >
  >;

  simulatedStocks: HelperType<
    {
      referenceDate: Date;
      deliveryProviderType: DeliveryProviderType;
    },
    Promise<
      Array<{
        _id: string;
        deliveryProvider?: DeliveryProvider;
        warehousingProvider?: WarehousingProvider;
        quantity?: number;
      }>
    >
  >;

  baseUnit: HelperType<never, string>;
  sku: HelperType<never, string>;
  dimensions: HelperType<never, ProductSupply>;
}

export interface ProductAssortmentPathHelperTypes {
  assortmentProduct: (product: Product, _: never, context: Context) => Promise<AssortmentProduct>;
}

export interface ProductBundleItemHelperTypes {
  product: (bundleItem: ProductBundleItem, _: never, context: Context) => Promise<Product>;
}

export type ProductCatalogHelperType<P, T> = (
  productPrice: ProductPrice,
  params: P,
  context: Context,
) => T;

export interface ProductCatalogPriceHelperTypes {
  isTaxable: ProductCatalogHelperType<never, boolean>;

  isNetPrice: ProductCatalogHelperType<never, boolean>;

  country: ProductCatalogHelperType<never, Promise<Country>>;
  currency: ProductCatalogHelperType<never, Promise<Currency>>;
}

/*
 * Settings
 */

export interface ProductsSettingsOptions {
  slugify?: (title: string) => string;
}

export interface ProductsSettings {
  slugify?: (title: string) => string;
  configureSettings: (options?: ProductsSettingsOptions) => void;
}
