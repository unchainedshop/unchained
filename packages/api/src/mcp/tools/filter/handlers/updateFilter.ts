import { Context } from '../../../../context.js';
import { FilterNotFoundError } from '../../../../errors.js';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.js';
import { Params } from '../schemas.js';

export default async function updateFilter(context: Context, params: Params<'UPDATE'>) {
  const { modules } = context;
  const { filterId, updateData } = params;

  if (!(await modules.filters.filterExists({ filterId }))) {
    throw new FilterNotFoundError({ filterId });
  }

  await modules.filters.update(filterId, updateData as any);
  const normalizedFilter = await getNormalizedFilterDetails(filterId, context);
  return { filter: normalizedFilter };
}
