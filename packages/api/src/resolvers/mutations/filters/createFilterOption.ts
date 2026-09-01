import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { type FilterInputText } from '@unchainedshop/core';
import { FilterNotFoundError, InvalidIdError } from '../../../errors.ts';

export default async function createFilterOption(
  root: never,
  params: { filterId: string; option: string; texts?: FilterInputText[] },
  context: Context,
) {
  const { modules, services, userId } = context;
  const { filterId, option, texts } = params;

  log(`mutation createFilterOption ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  if (!(await modules.filters.filterExists({ filterId }))) throw new FilterNotFoundError({ filterId });

  const filter = await services.filters.createFilterOption(filterId, { value: option });

  if (texts) {
    await modules.filters.texts.updateTexts({ filterId, filterOptionValue: option }, texts);
  }

  return filter;
}
