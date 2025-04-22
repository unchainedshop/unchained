import { UnchainedCore } from '@unchainedshop/core';
import { AssortmentMediaType } from '@unchainedshop/core-assortments';
import DataLoader from 'dataloader';

export default async (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ assortmentId?: string }, AssortmentMediaType[]>(async (queries) => {
    const assortmentIds = [...new Set(queries.map((q) => q.assortmentId).filter(Boolean))];
    const assortmentMediaItems = await unchainedAPI.modules.assortments.media.findAssortmentMedias({
      assortmentId: { $in: assortmentIds },
    });

    const assortmentMediaMap = {};
    for (const assortmentMedia of assortmentMediaItems) {
      if (!assortmentMediaMap[assortmentMedia.assortmentId]) {
        assortmentMediaMap[assortmentMedia.assortmentId] = [assortmentMedia];
      } else {
        assortmentMediaMap[assortmentMedia.assortmentId].push(assortmentMedia);
      }
    }
    return queries.map((q) => assortmentMediaMap[q.assortmentId] || []);
  });
