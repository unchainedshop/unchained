import type { Context } from '../../../../context.ts';
import { AssortmentNotFoundError } from '../../../../errors.ts';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.ts';
import type { Params } from '../schemas.ts';

export default async function setAssortmentBase(context: Context, params: Params<'SET_BASE'>) {
  const { modules } = context;
  const { assortmentId } = params;

  const existingAssortment = await modules.assortments.findAssortment({ assortmentId });
  if (!existingAssortment) throw new AssortmentNotFoundError({ assortmentId });

  await modules.assortments.setBase(assortmentId);
  return { assortment: await getNormalizedAssortmentDetails({ assortmentId }, context) };
}
