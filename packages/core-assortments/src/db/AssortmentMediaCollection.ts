import { mongodb, buildDbIndexes, TimestampFields } from '@unchainedshop/mongodb';

export type AssortmentMediaText = {
  _id?: string;
  assortmentMediaId: string;
  locale?: string;
  title?: string;
  subtitle?: string;
} & TimestampFields;

export type AssortmentMediaType = {
  _id?: string;
  mediaId: string;
  assortmentId: string;
  sortKey: number;
  tags: Array<string>;
  meta?: any;
} & TimestampFields;

export const AssortmentMediaCollection = async (db: mongodb.Db) => {
  const AssortmentMedia = db.collection<AssortmentMediaType>('assortment_media');
  const AssortmentMediaTexts = db.collection<AssortmentMediaText>('assortment_media_texts');

  // Assortment Indexes
  await buildDbIndexes(AssortmentMedia, [
    { index: { mediaId: 1 } },
    { index: { assortmentId: 1, sortKey: 1 } },
    { index: { tags: 1, sortKey: 1 } },
    { index: { assortmentId: 1, tags: 1, sortKey: 1 } },
  ]);

  // AssortmentTexts indexes
  await buildDbIndexes(AssortmentMediaTexts, [
    { index: { assortmentMediaId: 1 } },
    { index: { locale: 1 } },
  ]);

  return {
    AssortmentMedia,
    AssortmentMediaTexts,
  };
};
