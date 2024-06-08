import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import { FilterInputText } from '@unchainedshop/types/filters.js';
import { FilterNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function createFilterOption(
  root: Root,
  params: { filterId: string; option: string; texts?: FilterInputText[] },
  context: Context,
) {
  const { modules, userId } = context;
  const { filterId, option, texts } = params;

  log(`mutation createFilterOption ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  if (!(await modules.filters.filterExists({ filterId }))) throw new FilterNotFoundError({ filterId });

  const filter = await modules.filters.createFilterOption(filterId, { value: option }, context);

  if (texts?.length) {
    await modules.filters.texts.updateTexts({ filterId, filterOptionValue: option }, texts);
  }

  return filter;
}
