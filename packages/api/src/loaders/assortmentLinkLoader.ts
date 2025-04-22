import { UnchainedCore } from '@unchainedshop/core';
import { AssortmentLink } from '@unchainedshop/core-assortments';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ parentAssortmentId: string; childAssortmentId: string }, AssortmentLink>(
    async (queries) => {
      const parentAssortmentIds = [...new Set(queries.map((q) => q.parentAssortmentId).filter(Boolean))];

      const links = await unchainedAPI.modules.assortments.links.findLinks({
        parentAssortmentIds,
      });

      const assortmentLinkMap = {};
      for (const link of links) {
        if (!assortmentLinkMap[link.parentAssortmentId]) {
          assortmentLinkMap[link.parentAssortmentId] = [link];
        } else {
          assortmentLinkMap[link.parentAssortmentId].push(link);
        }
      }

      return queries.map((q) => {
        if (q.childAssortmentId) {
          return assortmentLinkMap[q.parentAssortmentId].find(
            (link) => link.childAssortmentId === q.childAssortmentId,
          );
        }
        return assortmentLinkMap[q.parentAssortmentId][0];
      });
    },
  );
