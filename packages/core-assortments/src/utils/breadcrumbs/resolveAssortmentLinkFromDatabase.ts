import { AssortmentLink } from '@unchainedshop/types/assortments.js';
import { mongodb } from '@unchainedshop/mongodb';

export function resolveAssortmentLinkFromDatabase(
  AssortmentLinks: mongodb.Collection<AssortmentLink>,
  selector: mongodb.Filter<AssortmentLink> = {},
) {
  return async (assortmentId: string, childAssortmentId: string) => {
    const links = await AssortmentLinks.find(
      { childAssortmentId: assortmentId, ...selector },
      {
        projection: { _id: 1, childAssortmentId: 1, parentAssortmentId: 1 },
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
