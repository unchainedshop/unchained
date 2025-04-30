import { log } from '@unchainedshop/logger';
import { Filter } from '@unchainedshop/core-filters';
import { Context } from '../../../context.js';
import { FilterDirector, FilterInputText } from '@unchainedshop/core';

export default async function createFilter(
  root: never,
  { filter, texts }: { filter: Filter; texts: FilterInputText[] },
  context: Context,
) {
  const { modules, userId } = context;
  log('mutation createFilter', { userId });

  const newFilter = await modules.filters.create(filter);

  await FilterDirector.invalidateProductIdCache(newFilter, context);

  if (texts) {
    await modules.filters.texts.updateTexts({ filterId: newFilter._id }, texts);
  }
  return newFilter;
}
