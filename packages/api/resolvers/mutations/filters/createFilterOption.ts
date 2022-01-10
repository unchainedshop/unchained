import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { FilterNotFoundError, InvalidIdError } from '../../../errors';
import { FilterOption } from '@unchainedshop/types/filters';

export default async function createFilterOption(
  root: Root,
  params: { filterId: string; option: { value: string; title: string } },
  context: Context
) {
  const { modules, localeContext, userId } = context;
  const { filterId, option } = params;

  log(`mutation createFilterOption ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  const filter = await modules.filters.findFilter({ filterId });
  if (!filter) throw new FilterNotFoundError({ filterId });

  return await modules.filters.createFilterOption(filterId, option, context);
}
