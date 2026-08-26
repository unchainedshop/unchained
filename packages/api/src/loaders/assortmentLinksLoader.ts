import type { UnchainedCore } from '@unchainedshop/core';
import type { AssortmentLink } from '@unchainedshop/core-assortments';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<
    { parentAssortmentId?: string; childAssortmentId?: string; assortmentId?: string },
    AssortmentLink[]
  >(async (queries) => {
    const parentAssortmentIds = [
      ...new Set(queries.flatMap((q) => q.parentAssortmentId).filter(Boolean) as string[]),
    ];
    const childAssortmentIds = [
      ...new Set(queries.flatMap((q) => q.childAssortmentId).filter(Boolean) as string[]),
    ];
    const assortmentIds = [
      ...new Set(queries.flatMap((q) => q.assortmentId).filter(Boolean) as string[]),
    ];

    const allLinks = await unchainedAPI.modules.assortments.links.findLinks({
      ...(parentAssortmentIds.length ? { parentAssortmentIds } : {}),
      ...(childAssortmentIds.length ? { childAssortmentIds } : {}),
      ...(assortmentIds.length ? { assortmentIds } : {}),
    });

    const parentAssortmentLinkMap = new Map<string, AssortmentLink[]>();
    const childAssortmentLinkMap = new Map<string, AssortmentLink[]>();

    for (const link of allLinks) {
      const parentLinks = parentAssortmentLinkMap.get(link.parentAssortmentId) || [];
      parentLinks.push(link);
      parentAssortmentLinkMap.set(link.parentAssortmentId, parentLinks);

      const childLinks = childAssortmentLinkMap.get(link.childAssortmentId) || [];
      childLinks.push(link);
      childAssortmentLinkMap.set(link.childAssortmentId, childLinks);
    }

    return queries.map((q) => {
      if (q.parentAssortmentId) {
        return parentAssortmentLinkMap.get(q.parentAssortmentId) || [];
      } else if (q.childAssortmentId) {
        return childAssortmentLinkMap.get(q.childAssortmentId) || [];
      }
      if (q.assortmentId) {
        return [
          ...(parentAssortmentLinkMap.get(q.assortmentId) || []),
          ...(childAssortmentLinkMap.get(q.assortmentId) || []),
        ];
      }
      return [];
    });
  });
