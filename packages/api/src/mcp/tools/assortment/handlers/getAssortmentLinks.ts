import type { Context } from '../../../../context.ts';
import { AssortmentNotFoundError } from '../../../../errors.ts';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.ts';
import type { Params } from '../schemas.ts';

export default async function getAssortmentLinks(context: Context, params: Params<'GET_LINKS'>) {
  const { loaders } = context;
  const { assortmentId } = params;

  const assortment = await getNormalizedAssortmentDetails({ assortmentId }, context);
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  const assortmentLinks = await loaders.assortmentLinksLoader.load({
    assortmentId,
  });
  const links = await Promise.all(
    assortmentLinks
      ?.filter((a) => a?.childAssortmentId !== assortment._id)
      ?.map(async (link) => ({
        ...(await getNormalizedAssortmentDetails({ assortmentId: link?.childAssortmentId }, context)),
        ...link,
      })) || [],
  );
  return { assortment, links };
}
