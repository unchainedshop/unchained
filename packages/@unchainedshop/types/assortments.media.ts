import { Context } from './api';
import { TimestampFields, _ID } from './common';
import { File } from './files';

export type AssortmentMedia = {
  _id?: _ID;
  mediaId: string;
  assortmentId: string;
  sortKey: number;
  tags: Array<string>;
  meta?: any;
  authorId: string;
} & TimestampFields;

export type AssortmentMediaText = {
  _id?: _ID;
  assortmentMediaId: string;
  locale?: string;
  authorId: string;
  title?: string;
  subtitle?: string;
} & TimestampFields;

export type AssortmentMediaModule = {
  // Queries
  findAssortmentMedia: (params: {
    assortmentMediaId: string;
  }) => Promise<AssortmentMedia>;

  findAssortmentMedias: (params: {
    assortmentId: string;
    limit: number;
    offset: number;
    tags?: Array<string>;
  }) => Promise<Array<AssortmentMedia>>;

  // Mutations
  create: (doc: AssortmentMedia, userId: string) => Promise<AssortmentMedia>;

  delete: (assortmentMediaId: string, userId?: string) => Promise<number>;

  updateManualOrder: (
    params: {
      sortKeys: Array<{
        assortmentMediaId: string;
        sortKey: number;
      }>;
    },
    userId?: string
  ) => Promise<Array<AssortmentMedia>>;

  texts: {
    // Queries
    findMediaTexts: (query: {
      assortmentMediaId: string;
    }) => Promise<Array<AssortmentMediaText>>;

    findLocalizedMediaText: (query: {
      assortmentMediaId: string;
      locale: string;
    }) => Promise<AssortmentMediaText>;

    // Mutations
    updateMediaTexts: (
      assortmentMediaId: string,
      texts: Array<AssortmentMediaText>,
      userId: string
    ) => Promise<Array<AssortmentMediaText>>;
  };
};

type HelperType<P, T> = (
  assortmentMedia: AssortmentMedia,
  params: P,
  context: Context
) => T;

export interface AssortmentMediaHelperTypes {
  texts: HelperType<{ forceLocale?: string }, Promise<AssortmentMediaText>>
  file: HelperType<any, Promise<File>>;
}
