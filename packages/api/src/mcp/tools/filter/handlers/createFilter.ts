import type { Context } from '../../../../context.ts';
import { FilterDirector } from '@unchainedshop/core';
import { getNormalizedFilterDetails } from '../../../utils/getNormalizedFilterDetails.ts';
import type { Params } from '../schemas.ts';
import type { FilterText } from '@unchainedshop/core-filters';

export default async function createFilter(context: Context, params: Params<'CREATE'>) {
  const { modules } = context;
  const { filter, texts } = params;
  const { key, type, options = [] } = filter as any;

  const newFilter = await modules.filters.create({
    key,
    type,
    options,
    isActive: true,
  });

  await FilterDirector.invalidateProductIdCache(newFilter, context);

  if (texts && texts.length > 0) {
    await modules.filters.texts.updateTexts({ filterId: newFilter._id }, texts as FilterText[]);
  }

  const normalizedFilter = await getNormalizedFilterDetails(newFilter._id, context);
  return { filter: normalizedFilter };
}
