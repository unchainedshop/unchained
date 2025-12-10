import type { Context } from '../../../../context.ts';
import { AssortmentNotFoundError } from '../../../../errors.ts';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.ts';
import type { Params } from '../schemas.ts';

export default async function updateAssortmentStatus(context: Context, params: Params<'UPDATE_STATUS'>) {
  const { modules } = context;
  const { assortmentId, statusAction } = params;
  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const updateData = {
    isActive: statusAction === 'ACTIVATE',
  };

  await modules.assortments.update(assortmentId, updateData as any);
  return { assortment: await getNormalizedAssortmentDetails({ assortmentId }, context) };
}
