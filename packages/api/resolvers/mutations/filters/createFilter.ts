import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { Filter } from '@unchainedshop/types/filters';

export default async function createFilter(
  root: Root,
  { filter }: { filter: Filter & { title: string } },
  { modules, localeContext, userId }: Context
) {
  log('mutation createFilter', { userId });

  return await modules.filters.create(
    {
      ...filter,
      locale: localeContext.language,
      authorId: userId,
    },
    userId
  );
}
