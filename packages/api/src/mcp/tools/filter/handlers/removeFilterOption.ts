import type { Context } from '../../../../context.ts';
import { FilterNotFoundError } from '../../../../errors.ts';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.ts';
import type { Params } from '../schemas.ts';

export default async function removeFilterOption(context: Context, params: Params<'REMOVE_OPTION'>) {
  const { modules, services } = context;
  const { filterId, option } = params;

  if (!(await modules.filters.filterExists({ filterId }))) {
    throw new FilterNotFoundError({ filterId });
  }

  const removedFilterOption = await services.filters.removeFilterOption({
    filterId,
    filterOptionValue: option,
  });

  if (!removedFilterOption) return { filter: null };

  const normalizedFilter = await getNormalizedFilterDetails(filterId, context);
  return { filter: normalizedFilter };
}
