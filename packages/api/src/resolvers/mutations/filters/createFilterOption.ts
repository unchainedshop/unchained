import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { FilterDirector, FilterInputText } from '@unchainedshop/core';
import { FilterNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function createFilterOption(
  root: never,
  params: { filterId: string; option: string; texts?: FilterInputText[] },
  context: Context,
) {
  const { modules, userId } = context;
  const { filterId, option, texts } = params;

  log(`mutation createFilterOption ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  if (!(await modules.filters.filterExists({ filterId }))) throw new FilterNotFoundError({ filterId });

  const filter = await modules.filters.createFilterOption(filterId, { value: option });
  await FilterDirector.invalidateProductIdCache(filter!, context);

  if (texts) {
    await modules.filters.texts.updateTexts({ filterId, filterOptionValue: option }, texts);
  }

  return filter;
}
