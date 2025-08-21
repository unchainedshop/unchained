import { Context } from '../../../../context.js';
import { AssortmentNotFoundError } from '../../../../errors.js';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.js';
import { Params } from '../schemas.js';

export default async function addAssortmentLink(context: Context, params: Params<'ADD_LINK'>) {
  const { modules } = context;
  const { parentAssortmentId, childAssortmentId } = params;

  const parentAssortment = await modules.assortments.findAssortment({
    assortmentId: parentAssortmentId,
  });
  if (!parentAssortment) throw new AssortmentNotFoundError({ assortmentId: parentAssortmentId });

  const childAssortment = await modules.assortments.findAssortment({
    assortmentId: childAssortmentId,
  });
  if (!childAssortment) throw new Error(`Child assortment not found: ${childAssortmentId}`);

  return {
    assortment: await getNormalizedAssortmentDetails({ assortmentId: parentAssortmentId }, context),
  };
}
