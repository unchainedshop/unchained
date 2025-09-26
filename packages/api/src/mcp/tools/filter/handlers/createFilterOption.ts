import { Context } from '../../../../context.js';
import { FilterDirector } from '@unchainedshop/core';
import { FilterNotFoundError } from '../../../../errors.js';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.js';
import { Params } from '../schemas.js';
import { FilterText } from '@unchainedshop/core-filters';

export default async function createFilterOption(context: Context, params: Params<'CREATE_OPTION'>) {
  const { modules } = context;
  const { filterId, option, optionTexts } = params;

  if (!(await modules.filters.filterExists({ filterId }))) {
    throw new FilterNotFoundError({ filterId });
  }

  const newOptions = await modules.filters.createFilterOption(filterId, { value: option });
  await FilterDirector.invalidateProductIdCache(newOptions, context);

  if (optionTexts && optionTexts.length > 0) {
    await modules.filters.texts.updateTexts(
      { filterId, filterOptionValue: option },
      optionTexts as FilterText[],
    );
  }

  const normalizedFilter = await getNormalizedFilterDetails(filterId, context);
  return { filter: normalizedFilter };
}
