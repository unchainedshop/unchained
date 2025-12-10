import type { UnchainedCore } from '@unchainedshop/core';
import type { AssortmentLink } from '@unchainedshop/core-assortments';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<
    { parentAssortmentId?: string; childAssortmentId?: string; assortmentId?: string },
    AssortmentLink[]
  >(async (queries) => {
    const parentAssortmentIds = queries.flatMap((q) => q.parentAssortmentId).filter(Boolean) as string[];
    const childAssortmentIds = queries.flatMap((q) => q.childAssortmentId).filter(Boolean) as string[];
    const assortmentIds = queries.flatMap((q) => q.assortmentId).filter(Boolean) as string[];

    const allLinks = await unchainedAPI.modules.assortments.links.findLinks({
      assortmentIds: [...new Set([...parentAssortmentIds, ...childAssortmentIds, ...assortmentIds])],
    });

    const parentAssortmentLinkMap = {};
    const childAssortmentLinkMap = {};

    for (const link of allLinks) {
      if (!parentAssortmentLinkMap[link.parentAssortmentId]) {
        parentAssortmentLinkMap[link.parentAssortmentId] = [link];
      } else {
        parentAssortmentLinkMap[link.parentAssortmentId].push(link);
      }

      if (!childAssortmentLinkMap[link.childAssortmentId]) {
        childAssortmentLinkMap[link.childAssortmentId] = [link];
      } else {
        childAssortmentLinkMap[link.childAssortmentId].push(link);
      }
    }

    return queries.map((q) => {
      if (q.parentAssortmentId) {
        return parentAssortmentLinkMap[q.parentAssortmentId] || [];
      } else if (q.childAssortmentId) {
        return childAssortmentLinkMap[q.childAssortmentId] || [];
      }
      if (q.assortmentId) {
        return [
          ...(parentAssortmentLinkMap[q.assortmentId] || []),
          ...(childAssortmentLinkMap[q.assortmentId] || []),
        ];
      }
      return [];
    });
  });
