import type { UnchainedCore } from '@unchainedshop/core';
import type { Assortment } from '@unchainedshop/core-assortments';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ assortmentId: string }, Assortment>(async (queries) => {
    const assortmentIds = [...new Set(queries.map((q) => q.assortmentId).filter(Boolean))];

    const assortments = await unchainedAPI.modules.assortments.findAssortments({
      assortmentIds,
      includeInactive: true,
      includeLeaves: true,
    });

    const assortmentMap = {};
    for (const assortment of assortments) {
      assortmentMap[assortment._id] = assortment;
    }
    return queries.map((q) => assortmentMap[q.assortmentId]);
  });
