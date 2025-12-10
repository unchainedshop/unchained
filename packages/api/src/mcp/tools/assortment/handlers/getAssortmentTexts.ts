import type { Context } from '../../../../context.ts';
import { AssortmentNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

export default async function getAssortmentTexts(context: Context, params: Params<'GET_TEXTS'>) {
  const { modules } = context;
  const { assortmentId } = params;

  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const texts = await modules.assortments.texts.findTexts({ assortmentId });
  return { texts };
}
