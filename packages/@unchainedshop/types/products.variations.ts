import { Locale } from 'locale';
import { Context } from './api';
import { TimestampFields, _ID } from './common';
import { Product, ProductAssignment, ProductConfiguration } from './products';
import { ProductPricingContext } from './products.pricing';

export enum ProductVariationType {
  COLOR = 'COLOR',
  TEXT = 'TEXT',
}

export type ProductVariation = {
  _id?: _ID;
  authorId: string;
  key?: string;
  options: Array<string>;
  productId: string;
  type?: string;
} & TimestampFields;

export type ProductVariationText = {
  authorId: string;
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

export type ProductVariationModule = {
  // Queries
  findProductVariation: (params: {
    productVariantionId: string;
  }) => Promise<ProductVariation>;

  findProductVariations: (params: {
    productId: string;
    limit: number;
    offset: number;
    tags?: Array<string>;
  }) => Promise<Array<ProductVariation>>;

  // Mutations
  create: (doc: ProductVariation, userId?: string) => Promise<ProductVariation>;

  delete: (productVariationId: string, userId?: string) => Promise<number>;

  createVariationOption: (
    productVariationId: string,
    data: {
      inputData: { value: string; title: string };
      localeContext: Locale;
    },
    userId?: string
  ) => Promise<ProductVariation>;

  deleteVariationOption: (
    productVariationId: string,
    productVariationOptionValue: string
  ) => Promise<void>;

  option: (
    productVariationOptionValue: string
  ) => Promise<ProductVariationOption>;

  texts: {
    // Queries
    findVariationTexts: (query: {
      productVariationId: string;
      productVariationOptionValue?: string;
    }) => Promise<Array<ProductVariationText>>;

    findLocalizedVariationText: (query: {
      productVariationId: string;
      locale: string;
    }) => Promise<ProductVariationText>;

    // Mutations
    updateVariationTexts: (
      productVariationId: string,
      texts: Array<ProductVariationText>,
      productVariationOptionValue?: string,
      userId?: string
    ) => Promise<Array<ProductVariationText>>;
  };
};

type HelperType<P, T> = (
  productVariantion: ProductVariation,
  params: P,
  context: Context
) => T;

export interface ProductVariationHelperTypes {
  texts: HelperType<{ forceLocale?: string }, Promise<ProductVariationText>>;
}

export interface ProductVariationOptionHelperTypes {
  _id: HelperType<never, string>;
  texts: HelperType<{ forceLocale?: string }, Promise<ProductVariationText>>;
  value: HelperType<never, string>;
}

type AssignmentHelperType<T> = (
  data: { product: Product; assignment: ProductAssignment },
  _: never,
  context: Context
) => T;

export interface ProductVariationAssignmentHelperTypes {
  _id: AssignmentHelperType<string>;
  vectors: AssignmentHelperType<
    Array<{ product: Product } & ProductConfiguration>
  >;
  product: AssignmentHelperType<Promise<Product>>;
}

type AssignmentVectorHelperType<T> = (
  data: { product: Product } & ProductConfiguration,
  _: never,
  context: Context
) => T;

export interface ProductVariationAssignmentVectorHelperTypes {
  _id: AssignmentVectorHelperType<string>;
  option: AssignmentVectorHelperType<Promise<ProductVariationOption>>;
  variation: AssignmentVectorHelperType<Promise<ProductVariation>>;
}
