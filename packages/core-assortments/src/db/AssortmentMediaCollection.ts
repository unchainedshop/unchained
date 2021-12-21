import {
  AssortmentMedia,
  AssortmentMediaText,
} from '@unchainedshop/types/assortments.media';
import { Db } from '@unchainedshop/types/common';
import { buildDbIndexes } from 'meteor/unchained:utils';

export const AssortmentMediaCollection = async (db: Db) => {
  const AssortmentMedia = db.collection<AssortmentMedia>('assortment_media');
  const AssortmentMediaTexts = db.collection<AssortmentMediaText>(
    'assortment_media_texts'
  );

  // Assortment Indexes
  await buildDbIndexes(AssortmentMedia, [
    { index: { mediaId: 1 } },
    { index: { assortmentId: 1 } },
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
