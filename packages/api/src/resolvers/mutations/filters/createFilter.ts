import { log } from '@unchainedshop/logger';
import { Filter } from '@unchainedshop/core-filters';
import { Context } from '../../../context.js';
import { FilterInputText } from '@unchainedshop/core';

export default async function createFilter(
  root: never,
  { filter, texts }: { filter: Filter; texts: FilterInputText[] },
  context: Context,
) {
  const { modules, localeContext, userId } = context;
  log('mutation createFilter', { userId });

  const newFilter = await modules.filters.create(
    {
      ...filter,
      title: '',
      locale: localeContext.language,
    },
    context,
  );
  if (texts) {
    await modules.filters.texts.updateTexts({ filterId: newFilter._id }, texts);
  }
  return newFilter;
}
