import type { FilterText } from '@unchainedshop/core-filters';
import type { Context } from '../../../../context.ts';
import { FilterNotFoundError } from '../../../../errors.ts';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.ts';
import type { Params } from '../schemas.ts';

export default async function updateFilterTexts(context: Context, params: Params<'UPDATE_TEXTS'>) {
  const { modules } = context;
  const { filterId, textUpdates, filterOptionValue } = params;

  if (!(await modules.filters.filterExists({ filterId }))) {
    throw new FilterNotFoundError({ filterId });
  }

  const updatedTexts = await modules.filters.texts.updateTexts(
    { filterId, filterOptionValue: filterOptionValue || null },
    textUpdates as FilterText[],
  );

  const normalizedFilter = await getNormalizedFilterDetails(filterId, context);
  return { texts: updatedTexts, filter: normalizedFilter };
}
