import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { FilterNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeFilterOption(
  root: Root,
  {
    filterId,
    filterOptionValue,
  }: { filterId: string; filterOptionValue: string },
  { modules, userId }: Context
) {
  log(`mutation removeFilterOption ${filterId}`, { userId });

  if (!filterId || !filterOptionValue)
    throw new InvalidIdError({ filterId, filterOptionValue });

  if (!(await modules.filters.filterExists({ filterId })))
    throw new FilterNotFoundError({ filterId });

  return modules.filters.removeFilterOption({
    filterId,
    filterOptionValue,
  });
}
