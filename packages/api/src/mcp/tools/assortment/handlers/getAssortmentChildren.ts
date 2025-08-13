import { Context } from '../../../../context.js';
import { AssortmentNotFoundError } from '../../../../errors.js';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.js';
import { Params } from '../schemas.js';

export default async function getAssortmentChildren(context: Context, params: Params<'GET_CHILDREN'>) {
  const { modules } = context;
  const { assortmentId, includeInactive = false } = params;

  if (assortmentId) {
    const assortment = await modules.assortments.findAssortment({ assortmentId });
    if (!assortment) throw new AssortmentNotFoundError({ assortmentId });
  }
  const children = await modules.assortments.children({ assortmentId, includeInactive });

  const children_normalized = await Promise.all(
    children?.map(async (link) => ({
      ...(await getNormalizedAssortmentDetails({ assortmentId: link?._id }, context)),
      ...link,
    })) || [],
  );
  return { children: children_normalized };
}
