import type { Context } from '../../../../context.ts';
import { FilterNotFoundError } from '../../../../errors.ts';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.ts';
import type { Params } from '../schemas.ts';
import type { FilterText } from '@unchainedshop/core-filters';

export default async function createFilterOption(context: Context, params: Params<'CREATE_OPTION'>) {
  const { modules, services } = context;
  const { filterId, option, optionTexts } = params;

  if (!(await modules.filters.filterExists({ filterId }))) {
    throw new FilterNotFoundError({ filterId });
  }

  const newOption = await services.filters.createFilterOption(filterId, { value: option });
  if (!newOption) return { filter: null };

  if (optionTexts && optionTexts.length > 0) {
    await modules.filters.texts.updateTexts(
      { filterId, filterOptionValue: option },
      optionTexts as FilterText[],
    );
  }

  const normalizedFilter = await getNormalizedFilterDetails(filterId, context);
  return { filter: normalizedFilter };
}
