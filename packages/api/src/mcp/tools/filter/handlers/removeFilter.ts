import type { Context } from '../../../../context.ts';
import { FilterNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

export default async function removeFilter(context: Context, params: Params<'REMOVE'>) {
  const { modules, services } = context;
  const { filterId } = params;

  const filter = await modules.filters.findFilter({ filterId });
  if (!filter) throw new FilterNotFoundError({ filterId });

  await services.filters.removeFilter({ filter });
  return { success: true };
}
