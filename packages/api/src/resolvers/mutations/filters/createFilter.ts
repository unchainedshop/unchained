import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api';
import { Filter } from '@unchainedshop/types/filters';

export default async function createFilter(
  root: Root,
  { filter }: { filter: Filter & { title: string } },
  context: Context,
) {
  const { modules, localeContext, userId } = context;
  log('mutation createFilter', { userId });

  return modules.filters.create(
    {
      ...filter,
      locale: localeContext.language,
    },
    context,
    { skipInvalidation: false },
    userId,
  );
}
