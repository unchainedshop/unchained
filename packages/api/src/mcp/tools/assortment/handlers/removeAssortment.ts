import type { Context } from '../../../../context.ts';
import { AssortmentNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

export default async function removeAssortment(context: Context, params: Params<'REMOVE'>) {
  const { modules } = context;
  const { assortmentId } = params;

  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const deletedAssortment = await modules.assortments.delete(assortmentId);
  return { success: Boolean(deletedAssortment) };
}
