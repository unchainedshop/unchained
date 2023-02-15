import { Context, SortOption } from './api';
import { AssortmentPathLink, AssortmentProduct } from './assortments';
import { FindOptions, Query, TimestampFields, Update, _ID } from './common';
import { UnchainedCore } from './core';
import { Country } from './countries';
import { Currency } from './currencies';
import { DeliveryProvider, DeliveryProviderType } from './delivery';
import { IDiscountAdapter } from './discount';
import { OrderPosition } from './orders.positions';
import { OrderPrice } from './orders.pricing';
import { ProductMedia, ProductMediaModule } from './products.media';
import {
  IProductPricingSheet,
  ProductPriceRate,
  ProductPricingCalculation,
  ProductPricingContext,
} from './products.pricing';
import { ProductReview, ProductReviewsModule } from './products.reviews';
import { ProductVariationsModule, ProductVariation } from './products.variations';
import { WarehousingProvider } from './warehousing';

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

export interface ProductPlan {
  billingInterval?: string;
  billingIntervalCount?: number;
  usageCalculationType?: string;
  trialInterval?: string;
  trialIntervalCount?: number;
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
  _id?: _ID;
  authorId: string;
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
} & TimestampFields;

export type ProductText = {
  _id?: _ID;
  productId: string;
  authorId: string;
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
  _id?: _ID;
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
  productSelector?: Query;
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
  interface: (productDiscount: ProductDiscount) => IDiscountAdapter;

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
    requestContext: Context,
  ) => Promise<Product>;

  prices: {
    price: (
      product: Product,
      params: { country: string; currency: string; quantity?: number },
    ) => Promise<ProductPrice>;

    userPrice: (
      prodct: Product,
      params: {
        country: string;
        currency: string;
        quantity?: number;
        useNetPrice?: boolean;
        configuration?: Array<ProductConfiguration>;
      },
      requestContext: Context,
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
        country: string;
        currency: string;
        includeInactive?: boolean;
        quantity?: number;
        useNetPrice?: boolean;
        vectors: Array<ProductConfiguration>;
      },
      requestContext: Context,
    ) => Promise<ProductPriceRange>;

    rates: {
      getRate(baseCurrency: string, quoteCurrency: string, maxAge: number): Promise<number | null>;
      updateRate(rate: ProductPriceRate): Promise<boolean>;
    };
  };

  // Product adapter

  calculate: (
    pricingContext: ProductPricingContext & { item: OrderPosition },
    requestContext: Context,
  ) => Promise<Array<ProductPricingCalculation>>;

  // Mutations
  create: (
    doc: Product & { title: string; locale: string },
    userId?: string,
    options?: { autopublish?: boolean },
  ) => Promise<Product>;

  delete: (productId: string, userId?: string) => Promise<number>;
  deleteProductPermanently: (params: { productId: string }) => Promise<number>;

  update: (productId: string, doc: Update<Product>, userId: string) => Promise<string>;

  publish: (product: Product, userId?: string) => Promise<boolean>;
  unpublish: (product: Product, userId?: string) => Promise<boolean>;

  /*
   * Product bundle items
   */

  bundleItems: {
    addBundleItem: (productId: string, doc: ProductBundleItem, userId?: string) => Promise<string>;
    removeBundleItem: (productId: string, index: number, userId?: string) => Promise<ProductBundleItem>;
  };

  /*
   * Product assignments
   */

  assignments: {
    addProxyAssignment: (
      productId: string,
      params: { proxyId: string; vectors: Array<ProductConfiguration> },
      userId?: string,
    ) => Promise<string>;
    removeAssignment: (
      productId: string,
      params: { vectors: Array<ProductConfiguration> },
      userId?: string,
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
    buildActiveStatusFilter: () => Query;
    buildActiveDraftStatusFilter: () => Query;
    countFilteredProducts: (params: {
      productIds: Array<string>;
      productSelector: Query;
    }) => Promise<number>;
    findFilteredProducts: (params: {
      limit?: number;
      offset?: number;
      productIds: Array<string>;
      productSelector: Query;
      sort?: FindOptions['sort'];
    }) => Promise<Array<Product>>;
  };

  /*
   * Product texts
   */

  texts: {
    // Queries
    findTexts: (query: Query, options?: FindOptions) => Promise<Array<ProductText>>;

    findLocalizedText: (params: { productId: string; locale?: string }) => Promise<ProductText>;
    searchTexts: ({ searchText }: { searchText: string }) => Promise<Array<string>>;

    // Mutations
    updateTexts: (
      productId: string,
      texts: Array<Omit<ProductText, 'productId' | 'authorId'>>,
      userId?: string,
    ) => Promise<Array<ProductText>>;

    upsertLocalizedText: (
      productId: string,
      locale: string,
      text: Omit<ProductText, 'productId' | 'locale' | 'authorId'>,
      userId?: string,
    ) => Promise<ProductText>;

    makeSlug: (data: { slug?: string; title: string; productId: string }) => Promise<string>;

    deleteMany: ({ productId }: { productId: string }) => Promise<number>;
  };
};

/*
 * Services
 */

export type RemoveProductService = (
  params: { productId: string; userId?: string },
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

  simulatedDiscounts: HelperType<
    { quantity?: number },
    Promise<
      Array<{
        _id: string;
        interface: any;
        total: ProductPrice;
      }>
    >
  >;

  salesUnit: HelperType<never, string>;
  salesQuantityPerUnit: HelperType<never, string>;
  defaultOrderQuantity: HelperType<never, number>;
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
