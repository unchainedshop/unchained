import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { Assortment } from '@unchainedshop/types/assortments';

export default async function createAssortment(
  root: Root,
  { assortment }: { assortment: Assortment & { title: string, locale?: string }},
  { modules, userId, localeContext }: Context
) {
  log('mutation createAssortment', { modules, userId });

  return await modules.assortments.create(
    {
      ...assortment,
      locale: localeContext.language,
      authorId: userId,
    },
    userId
  );
}
