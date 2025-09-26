import { FilterText } from '@unchainedshop/core-filters';
import { Context } from '../../../../context.js';
import { FilterNotFoundError } from '../../../../errors.js';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.js';
import { Params } from '../schemas.js';

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
