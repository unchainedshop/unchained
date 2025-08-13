import { Context } from '../../../../context.js';
import { AssortmentNotFoundError } from '../../../../errors.js';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.js';
import { Params } from '../schemas.js';

export default async function getAssortment(context: Context, params: Params<'GET'>) {
  const { modules } = context;
  const { assortmentId, slug } = params;

  let query: any = {};
  if (assortmentId) query = { assortmentId };
  else if (slug) query = { slug };
  else throw new Error('Either assortmentId or slug must be provided');

  const assortment = await modules.assortments.findAssortment(query);
  if (!assortment) throw new AssortmentNotFoundError(query);

  const assortment_details = await getNormalizedAssortmentDetails(
    { assortmentId: assortment._id },
    context,
  );
  return { assortment: assortment_details };
}
