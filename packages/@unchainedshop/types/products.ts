import { Context } from './api';
import { AssortmentPathLink, AssortmentProduct } from './assortments';
import { Update, FindOptions, TimestampFields, _ID } from './common';
import { Country } from './countries';
import { Currency } from './currencies';
import { ProductMedia, ProductMediaModule } from './products.media';

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

type ProductQuery = {
  slugs?: Array<string>;
  tags?: Array<string>;
  includeDrafts?: boolean;
};

export type ProductsModule = {
  // Queries
  findProduct: (params: {
    productId?: string;
    slug?: string;
  }) => Promise<Product>;

  findProducts: (
    params: ProductQuery & {
      limit?: number;
      offset?: number;
    },
    options?: FindOptions
  ) => Promise<Array<Product>>;

  count: (query: ProductQuery) => Promise<number>;
  productExists: (params: {
    productId?: string;
    slug?: string;
  }) => Promise<boolean>;

  // Transformations
  normalizedStatus: (product: Product) => string;

  proxyAssignments: (
    product: Product,
    options: { includeInactive?: boolean }
  ) => Promise<Array<{ assignment: ProductAssignment; product: Product }>>;

  proxyProducts: (
    product: Product,
    vectors: Array<ProductConfiguration>,
    options: { includeInactive?: boolean }
  ) => Promise<Array<Product>>;

  isActive: (product: Product) => boolean;
  isDraft: (product: Product) => boolean;

  prices: {
    price: (
      product: Product,
      params: { country: string; currency: string; quantity?: number },
      requestContext: Context
    ) => Promise<ProductPrice>;

    userPrice: (
      prodct: Product,
      params: {
        country: string;
        currency: string;
        quantity?: number;
        useNetPrice?: boolean;
      },
      requestContext: Context
    ) => Promise<ProductPrice>;

    catalogPrices: (prodct: Product) => Array<ProductPrice>;
    catalogPricesLeveled: (
      product: Product,
      params: { currency: string; country: string },
      requestContext: Context
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
      requestContext: Context
    ) => Promise<{
      _id: string;
      minPrice: ProductPrice;
      maxPrice: ProductPrice;
    }>;

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
      requestContext: Context
    ) => Promise<{
      _id: string;
      minPrice: ProductPrice;
      maxPrice: ProductPrice;
    }>;
  };

  // Mutations
  create: (
    doc: Product & { title: string; locale: string },
    userId?: string,
    options?: { autopublish?: boolean }
  ) => Promise<Product>;

  delete: (productId: string, userId?: string) => Promise<number>;
  deleteProductPermanently: (productId: string) => Promise<number>;

  update: (
    productId: string,
    doc: Update<Product>,
    userId: string
  ) => Promise<string>;

  publish: (product: Product, userId?: string) => Promise<boolean>;
  unpublish: (product: Product, userId?: string) => Promise<boolean>;

  /*
   * Product bundle items
   */

  bundleItems: {
    addBundleItem: (
      productId: string,
      doc: ProductBundleItem,
      userId?: string
    ) => Promise<string>;
    removeBundleItem: (
      productId: string,
      index: number,
      userId?: string
    ) => Promise<ProductBundleItem>;
  };

  /*
   * Product assignments
   */

  assignments: {
    addProxyAssignment: (
      productId: string,
      params: { proxyId: string; vectors: Array<ProductConfiguration> },
      userId?: string
    ) => Promise<string>;
    removeAssignment: (
      productId: string,
      params: { vectors: Array<ProductConfiguration> },
      userId?: string
    ) => Promise<number>;
  };

  /*
   * Product media
   */
  media: ProductMediaModule;
  // {
  //   addMedia: ({ rawFile: any, authorId: string }, userId?: string) => Promise<string>
  //   findMediaTexts({ productMediaId: string }) => Promise<Array<ProductText>>;
  // }

  /*
   * Product texts
   */

  texts: {
    // Queries
    findTexts: (params: { productId: string }) => Promise<Array<ProductText>>;

    findLocalizedText: (params: {
      productId: string;
      locale?: string;
    }) => Promise<ProductText>;
    searchTexts: ({ searchText: string }) => Promise<Array<string>>;

    // Mutations
    updateTexts: (
      productId: string,
      texts: Array<ProductText>,
      userId?: string
    ) => Promise<Array<ProductText>>;

    upsertLocalizedText: (
      productId: string,
      locale: string,
      text: ProductText,
      userId?: string
    ) => Promise<ProductText>;

    makeSlug: (data: {
      slug?: string;
      title: string;
      productId: string;
    }) => Promise<string>;

    deleteMany: (productId: string, userId?: string) => Promise<number>;
  };
};

type HelperType<P, T> = (product: Product, params: P, context: Context) => T;

export interface ProductHelperTypes {
  childrenCount: HelperType<{ includeInactive: boolean }, Promise<number>>;
  texts: HelperType<{ forceLocale?: string }, Promise<ProductText>>;

  assortmentPaths: HelperType<
    { forceLocale?: string },
    Promise<Array<{ links: Array<AssortmentPathLink> }>>
  >;

  siblings: HelperType<
    {
      assortmentId?: string;
      limit: number;
      offset: number;
      includeInactive: boolean;
    },
    Promise<Array<string>>
  >;

  media: HelperType<
    {
      limit: number;
      offset: number;
      tags?: Array<string>;
    },
    Promise<Array<ProductMedia>>
  >;
}

export interface ProductAssortmentPathHelperTypes {
  assortmentProduct: (
    product: Product,
    _: never,
    context: Context
  ) => Promise<AssortmentProduct>;
}

export interface ProductBundleItemHelperTypes {
  product: (
    bundleItem: ProductBundleItem,
    _: never,
    context: Context
  ) => Promise<Product>;
}

type ProductCatalogHelperType<P, T> = (
  productPrice: ProductPrice,
  params: P,
  context: Context
) => T;

export interface ProductCatalogPriceHelperTypes {
  isTaxable: ProductCatalogHelperType<never, boolean>;

  isNetPrice: ProductCatalogHelperType<never, boolean>;

  country: ProductCatalogHelperType<never, Promise<Country>>;
  currency: ProductCatalogHelperType<never, Promise<Currency>>;
}
