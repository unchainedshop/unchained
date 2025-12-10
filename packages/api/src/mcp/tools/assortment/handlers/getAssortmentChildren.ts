import type { Context } from '../../../../context.ts';
import { AssortmentNotFoundError } from '../../../../errors.ts';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.ts';
import type { Params } from '../schemas.ts';

export default async function getAssortmentChildren(context: Context, params: Params<'GET_CHILDREN'>) {
  const { modules } = context;
  const { assortmentId, includeInactive = false } = params;

  const assortment = await getNormalizedAssortmentDetails({ assortmentId }, context);
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const children = await modules.assortments.children({ assortmentId, includeInactive });

  const children_normalized = await Promise.all(
    children?.map(async (link) => ({
      ...(await getNormalizedAssortmentDetails({ assortmentId: link?._id }, context)),
      ...link,
    })) || [],
  );
  return { assortment, children: children_normalized };
}
