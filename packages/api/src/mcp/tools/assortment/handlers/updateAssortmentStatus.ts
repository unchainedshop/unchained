import { Context } from '../../../../context.js';
import { AssortmentNotFoundError } from '../../../../errors.js';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.js';
import { Params } from '../schemas.js';

export default async function updateAssortmentStatus(context: Context, params: Params<'UPDATE_STATUS'>) {
  const { modules } = context;
  const { assortmentId, statusAction } = params;
  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const updateData = {
    isActive: statusAction === 'ACTIVATE',
  };

  await modules.assortments.update(assortmentId, updateData as any);
  return { assortment: getNormalizedAssortmentDetails({ assortmentId }, context) };
}
