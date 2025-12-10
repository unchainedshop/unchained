import type { Context } from '../../../../context.ts';
import { FilterNotFoundError } from '../../../../errors.ts';
import type { Params } from '../schemas.ts';

export default async function getFilterTexts(context: Context, params: Params<'GET_TEXTS'>) {
  const { modules } = context;
  const { filterId, filterOptionValue } = params;

  if (!(await modules.filters.filterExists({ filterId }))) {
    throw new FilterNotFoundError({ filterId });
  }

  const texts = await modules.filters.texts.findTexts({
    filterId,
    filterOptionValue: filterOptionValue || null,
  });

  return { texts };
}
