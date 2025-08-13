import { Context } from '../../../../context.js';
import { FilterNotFoundError } from '../../../../errors.js';
import { Params } from '../schemas.js';

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
