import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { Filter, FilterInputText } from '@unchainedshop/types/filters.js';

export default async function createFilter(
  root: Root,
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
  await modules.filters.texts.updateTexts({ filterId: newFilter._id }, texts);
  return newFilter;
}
