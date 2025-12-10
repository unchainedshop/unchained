import type { Context } from '../../../../context.ts';
import { AssortmentNotFoundError } from '../../../../errors.ts';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.ts';
import type { Params } from '../schemas.ts';

export default async function updateAssortment(context: Context, params: Params<'UPDATE'>) {
  const { modules } = context;
  const { assortmentId, assortment } = params;

  const existingAssortment = await modules.assortments.findAssortment({ assortmentId });
  if (!existingAssortment) throw new AssortmentNotFoundError({ assortmentId });

  const updateData: any = {};

  if (assortment.isRoot !== undefined) updateData.isRoot = assortment.isRoot;
  if (assortment.isActive !== undefined) updateData.isActive = assortment.isActive;
  if (assortment.tags !== undefined) updateData.tags = assortment.tags;
  if (assortment.sequence !== undefined) updateData.sequence = assortment.sequence;
  if (assortment.meta !== undefined) updateData.meta = assortment.meta;

  if (Object.keys(updateData).length > 0) {
    await modules.assortments.update(assortmentId, updateData);
  }

  return { assortment: await getNormalizedAssortmentDetails({ assortmentId }, context) };
}
