import type { Filter, FindOptions } from 'mongodb';
import { TimestampFields } from './common.js';

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

export type ProductMediaModule = {
  // Queries
  findProductMedia: (params: { productMediaId: string }) => Promise<ProductMedia>;

  findProductMedias: (
    params: {
      productId?: string;
      limit?: number;
      offset?: number;
      tags?: Array<string>;
    },
    options?: FindOptions,
  ) => Promise<Array<ProductMedia>>;

  // Mutations
  create: (data: { productId: string; mediaId: string }) => Promise<ProductMedia>;

  delete: (productMediaId: string) => Promise<number>;
  deleteMediaFiles: (params: {
    productId?: string;
    excludedProductIds?: Array<string>;
    excludedProductMediaIds?: Array<string>;
  }) => Promise<number>;

  update: (productMediaId: string, productMedia: ProductMedia) => Promise<ProductMedia>;
  updateManualOrder: (params: {
    sortKeys: Array<{
      productMediaId: string;
      sortKey: number;
    }>;
  }) => Promise<Array<ProductMedia>>;

  texts: {
    // Queries
    findMediaTexts: (
      query: Filter<ProductMediaText>,
      options?: FindOptions,
    ) => Promise<Array<ProductMediaText>>;

    findLocalizedMediaText: (query: {
      productMediaId: string;
      locale: string;
    }) => Promise<ProductMediaText>;

    // Mutations
    updateMediaTexts: (
      productMediaId: string,
      texts: Array<Omit<ProductMediaText, 'productMediaId'>>,
    ) => Promise<Array<ProductMediaText>>;
  };
};
