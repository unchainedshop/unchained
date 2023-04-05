import {
  AssortmentMedia as AssortmentMediaType,
  AssortmentMediaText,
} from '@unchainedshop/types/assortments.media.js';
import { Db } from '@unchainedshop/types/common.js';
import { buildDbIndexes } from '@unchainedshop/mongodb';

export const AssortmentMediaCollection = async (db: Db) => {
  const AssortmentMedia = db.collection<AssortmentMediaType>('assortment_media');
  const AssortmentMediaTexts = db.collection<AssortmentMediaText>('assortment_media_texts');

  // Assortment Indexes
  await buildDbIndexes(AssortmentMedia, [
    { index: { mediaId: 1 } },
    { index: { assortmentId: 1 } },
    { index: { sortKey: 1 } },
    { index: { tags: 1 } },
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
