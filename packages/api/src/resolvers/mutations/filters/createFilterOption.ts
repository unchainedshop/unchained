import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import { FilterNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function createFilterOption(
  root: Root,
  params: { filterId: string; option: { value: string; title: string; locale?: string } },
  context: Context,
) {
  const { modules, userId } = context;
  const { filterId, option } = params;

  log(`mutation createFilterOption ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  if (!(await modules.filters.filterExists({ filterId }))) throw new FilterNotFoundError({ filterId });

  const filter = await modules.filters.createFilterOption(
    filterId,
    { ...option, locale: option?.locale || context.localeContext.language },
    context,
  );
  return filter;
}
