import { AssortmentLink } from '@unchainedshop/types/assortments.js';
import { Filter, Collection } from '@unchainedshop/types/common.js';

export function resolveAssortmentLinkFromDatabase(
  AssortmentLinks: Collection<AssortmentLink>,
  selector: Filter<AssortmentLink> = {},
) {
  return async (assortmentId: string, childAssortmentId: string) => {
    const links = await AssortmentLinks.find(
      { childAssortmentId: assortmentId, ...selector },
      {
        projection: { childAssortmentId: 1, parentAssortmentId: 1 },
        sort: { sortKey: 1, parentAssortmentId: 1 },
      },
    ).toArray();

    const parentIds = links.map((link) => link.parentAssortmentId);

    return {
      assortmentId,
      childAssortmentId,
      parentIds,
    };
  };
}
