import type { Filter, FindOptions } from 'mongodb';
import { TimestampFields } from './common.js';

export type AssortmentMedia = {
  _id?: string;
  mediaId: string;
  assortmentId: string;
  sortKey: number;
  tags: Array<string>;
  meta?: any;
} & TimestampFields;

export type AssortmentMediaText = {
  _id?: string;
  assortmentMediaId: string;
  locale?: string;
  title?: string;
  subtitle?: string;
} & TimestampFields;

export type AssortmentMediaModule = {
  // Queries
  findAssortmentMedia: (params: { assortmentMediaId: string }) => Promise<AssortmentMedia>;

  findAssortmentMedias: (
    params: {
      assortmentId?: string;
      limit?: number;
      offset?: number;
      tags?: Array<string>;
    },
    options?: FindOptions,
  ) => Promise<Array<AssortmentMedia>>;

  // Mutations
  create: (doc: { assortmentId: string; mediaId: string }) => Promise<AssortmentMedia>;

  delete: (assortmentMediaId: string) => Promise<number>;
  deleteMediaFiles: (params: {
    assortmentId?: string;
    excludedAssortmentIds?: Array<string>;
    excludedAssortmentMediaIds?: Array<string>;
  }) => Promise<number>;

  update: (assortmentMediaId: string, doc: AssortmentMedia) => Promise<AssortmentMedia>;

  updateManualOrder: (params: {
    sortKeys: Array<{
      assortmentMediaId: string;
      sortKey: number;
    }>;
  }) => Promise<Array<AssortmentMedia>>;

  texts: {
    // Queries
    findMediaTexts: (
      query: Filter<AssortmentMediaText>,
      options?: FindOptions,
    ) => Promise<Array<AssortmentMediaText>>;

    findLocalizedMediaText: (query: {
      assortmentMediaId: string;
      locale: string;
    }) => Promise<AssortmentMediaText>;

    // Mutations
    updateMediaTexts: (
      assortmentMediaId: string,
      texts: Array<Omit<AssortmentMediaText, 'assortmentMediaId'>>,
    ) => Promise<Array<AssortmentMediaText>>;
  };
};
