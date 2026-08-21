import { log } from '@unchainedshop/logger';
import type { Filter } from '@unchainedshop/core-filters';
import type { Context } from '../../../context.ts';
import { type FilterInputText } from '@unchainedshop/core';
import { DuplicateFilterKeyError } from '../../../errors.ts';

export default async function createFilter(
  root: never,
  { filter, texts }: { filter: Filter; texts: FilterInputText[] },
  context: Context,
) {
  const { modules, services, userId } = context;
  log('mutation createFilter', { userId });
  try {
    const newFilter = await services.filters.createFilter(filter);

    if (texts) {
      await modules.filters.texts.updateTexts({ filterId: newFilter._id }, texts);
    }
    return newFilter;
  } catch (e) {
    if (e?.message?.includes('duplicate')) throw new DuplicateFilterKeyError({ filter });
    else throw e;
  }
}
