import { Context } from '../../../../context.js';
import { FilterDirector } from '@unchainedshop/core';
import { FilterNotFoundError } from '../../../../errors.js';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.js';
import { Params } from '../schemas.js';

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
