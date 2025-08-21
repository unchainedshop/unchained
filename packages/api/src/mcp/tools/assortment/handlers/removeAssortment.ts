import { Context } from '../../../../context.js';
import { AssortmentNotFoundError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function removeAssortment(context: Context, params: Params<'REMOVE'>) {
  const { modules } = context;
  const { assortmentId } = params;

  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  await modules.assortments.delete(assortmentId);
  return { success: true };
}
