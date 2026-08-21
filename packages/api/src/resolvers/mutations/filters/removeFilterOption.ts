import { log } from '@unchainedshop/logger';
import { FilterNotFoundError, InvalidIdError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function removeFilterOption(
  root: never,
  { filterId, filterOptionValue }: { filterId: string; filterOptionValue: string },
  context: Context,
) {
  const { modules, services, userId } = context;
  log(`mutation removeFilterOption ${filterId}`, { userId });

  if (!filterId || !filterOptionValue) throw new InvalidIdError({ filterId, filterOptionValue });

  if (!(await modules.filters.filterExists({ filterId }))) throw new FilterNotFoundError({ filterId });

  return services.filters.removeFilterOption({ filterId, filterOptionValue });
}
