import { Context } from './api.js';
import { FindOptions, TimestampFields, _ID } from './common.js';
import { File } from './files.js';

export type ProductMedia = {
  _id?: _ID;
  mediaId: string;
  productId: string;
  sortKey: number;
  tags: Array<string>;
  meta?: any;
} & TimestampFields;

export type ProductMediaText = {
  _id?: _ID;
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
    excludedProductIds?: Array<_ID>;
    excludedProductMediaIds?: Array<_ID>;
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
    findMediaTexts: (query: { productMediaId: string }) => Promise<Array<ProductMediaText>>;

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

export type HelperType<P, T> = (productMedia: ProductMedia, params: P, context: Context) => T;

export interface ProductMediaHelperTypes {
  texts: HelperType<{ forceLocale?: string }, Promise<ProductMediaText>>;
  file: HelperType<never, Promise<File>>;
}
