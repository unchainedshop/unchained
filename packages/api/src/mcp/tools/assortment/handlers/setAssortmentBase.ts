import { Context } from '../../../../context.js';
import { AssortmentNotFoundError } from '../../../../errors.js';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.js';
import { Params } from '../schemas.js';

export default async function setAssortmentBase(context: Context, params: Params<'SET_BASE'>) {
  const { modules } = context;
  const { assortmentId } = params;

  const existingAssortment = await modules.assortments.findAssortment({ assortmentId });
  if (!existingAssortment) throw new AssortmentNotFoundError({ assortmentId });

  await modules.assortments.setBase(assortmentId);
  const assortment = await getNormalizedAssortmentDetails({ assortmentId }, context);
  return { assortment };
}
