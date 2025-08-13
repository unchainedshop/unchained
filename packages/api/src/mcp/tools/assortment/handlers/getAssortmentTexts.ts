import { Context } from '../../../../context.js';
import { AssortmentNotFoundError } from '../../../../errors.js';
import { Params } from '../schemas.js';

export default async function getAssortmentTexts(context: Context, params: Params<'GET_TEXTS'>) {
  const { modules } = context;
  const { assortmentId } = params;

  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const texts = await modules.assortments.texts.findTexts({ assortmentId });
  return { texts };
}
