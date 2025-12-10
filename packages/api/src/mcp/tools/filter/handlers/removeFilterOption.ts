import type { Context } from '../../../../context.ts';
import { FilterDirector } from '@unchainedshop/core';
import { FilterNotFoundError } from '../../../../errors.ts';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.ts';
import type { Params } from '../schemas.ts';

export default async function removeFilterOption(context: Context, params: Params<'REMOVE_OPTION'>) {
  const { modules } = context;
  const { filterId, option } = params;

  if (!(await modules.filters.filterExists({ filterId }))) {
    throw new FilterNotFoundError({ filterId });
  }

  const removedFilterOption = await modules.filters.removeFilterOption({
    filterId,
    filterOptionValue: option,
  });

  if (!removedFilterOption) return { filter: null };

  await FilterDirector.invalidateProductIdCache(removedFilterOption, context);

  const normalizedFilter = await getNormalizedFilterDetails(filterId, context);
  return { filter: normalizedFilter };
}
