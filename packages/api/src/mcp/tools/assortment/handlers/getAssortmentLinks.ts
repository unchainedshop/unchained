import { Context } from '../../../../context.js';
import { AssortmentNotFoundError } from '../../../../errors.js';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.js';
import { Params } from '../schemas.js';

export default async function getAssortmentLinks(context: Context, params: Params<'GET_LINKS'>) {
  const { loaders } = context;
  const { assortmentId } = params;

  const assortment = await getNormalizedAssortmentDetails({ assortmentId }, context);
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const assortmentLinks = await loaders.assortmentLinksLoader.load({
    assortmentId,
  });
  const links = await Promise.all(
    assortmentLinks?.map(async (link) => ({
      ...(await getNormalizedAssortmentDetails({ assortmentId: link?.childAssortmentId }, context)),
      ...link,
    })) || [],
  );
  return { assortment, links };
}
