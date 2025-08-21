import { Context } from '../../../../context.js';
import { AssortmentNotFoundError } from '../../../../errors.js';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.js';
import { Params } from '../schemas.js';

export default async function addAssortmentFilter(context: Context, params: Params<'ADD_FILTER'>) {
  const { modules } = context;
  const { assortmentId, filterId, tags } = params;

  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const filter = await modules.filters.findFilter({ filterId });
  if (!filter) throw new Error(`Filter not found: ${filterId}`);

  await modules.assortments.filters.create({
    assortmentId,
    filterId,
    tags,
  } as any);

  return { assortment: await getNormalizedAssortmentDetails({ assortmentId }, context) };
}
