import { Context } from '../../../../context.js';
import { getNormalizedAssortmentDetails } from '../../../utils/getNormalizedAssortmentDetails.js';
import { Params } from '../schemas.js';

export default async function listAssortments(context: Context, params: Params<'LIST'>) {
  const { modules } = context;
  const {
    limit = 50,
    offset = 0,
    tags,
    slugs,
    queryString,
    includeInactive = false,
    includeLeaves = false,
    sort,
  } = params;

  const sortOptions = sort?.map((s) => ({ key: s.key, value: s.value as any })) || undefined;

  const assortments = await modules.assortments.findAssortments({
    limit,
    offset,
    tags,
    slugs,
    queryString,
    includeInactive,
    includeLeaves,
    sort: sortOptions,
  });
  const assortments_normalized = await Promise.all(
    assortments?.map(
      async ({ _id }) => await getNormalizedAssortmentDetails({ assortmentId: _id }, context),
    ) || [],
  );
  return { assortments: assortments_normalized };
}
