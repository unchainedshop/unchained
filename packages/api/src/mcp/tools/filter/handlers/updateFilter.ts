import type { Context } from '../../../../context.ts';
import { FilterDirector } from '@unchainedshop/core';
import { FilterNotFoundError } from '../../../../errors.ts';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.ts';
import type { Params } from '../schemas.ts';

export default async function updateFilter(context: Context, params: Params<'UPDATE'>) {
  const { modules } = context;
  const { filterId, updateData } = params;

  if (!(await modules.filters.filterExists({ filterId }))) {
    throw new FilterNotFoundError({ filterId });
  }

  const updatedFilter = await modules.filters.update(filterId, updateData as any);
  // An update can change the key, the type or the options, all of which the product id cache is
  // derived from. The GraphQL mutation has always invalidated here; this path had not.
  await FilterDirector.invalidateProductIdCache(updatedFilter!, context);

  const normalizedFilter = await getNormalizedFilterDetails(filterId, context);
  return { filter: normalizedFilter };
}
