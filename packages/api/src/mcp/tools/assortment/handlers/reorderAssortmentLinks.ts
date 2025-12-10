import type { Context } from '../../../../context.ts';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.ts';
import type { Params } from '../schemas.ts';

export default async function reorderAssortmentLinks(context: Context, params: Params<'REORDER_LINKS'>) {
  const { modules } = context;
  const { sortKeys } = params;

  const links = await modules.assortments.links.updateManualOrder({ sortKeys: sortKeys as any });
  const normalizedAssortmentLinks = await Promise.all(
    links?.map(async (link) => ({
      ...(await getNormalizedAssortmentDetails({ assortmentId: link?.childAssortmentId }, context)),
      ...link,
    })) || [],
  );
  return { assortments: normalizedAssortmentLinks };
}
