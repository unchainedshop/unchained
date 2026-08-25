import type { Context } from '../../../../context.ts';
import { FilterNotFoundError } from '../../../../errors.ts';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.ts';
import type { Params } from '../schemas.ts';

export default async function updateFilter(context: Context, params: Params<'UPDATE'>) {
  const { modules, services } = context;
  const { filterId, updateData } = params;

  if (!(await modules.filters.filterExists({ filterId }))) {
    throw new FilterNotFoundError({ filterId });
  }

  // The service invalidates the product id cache; an update can change the key, type or options,
  // all of which it is derived from. This MCP path previously did not invalidate at all.
  await services.filters.updateFilter(filterId, updateData as any);

  const normalizedFilter = await getNormalizedFilterDetails(filterId, context);
  return { filter: normalizedFilter };
}
