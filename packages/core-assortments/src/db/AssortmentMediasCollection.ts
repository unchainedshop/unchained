import {
  AssortmentMedia,
  AssortmentMediaText,
} from '@unchainedshop/types/assortments.media';
import { Db } from '@unchainedshop/types/common';
import { buildDbIndexes } from 'meteor/unchained:utils';

export const AssortmentMediaCollection = async (db: Db) => {
  const AssortmentMedias = db.collection<AssortmentMedia>('assortment_media');
  const AssortmentMediaTexts = db.collection<AssortmentMediaText>(
    'assortment_media_texts'
  );

  // Assortment Indexes
  await buildDbIndexes(AssortmentMedias, [
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
    AssortmentMedias,
    AssortmentMediaTexts,
  };
};
