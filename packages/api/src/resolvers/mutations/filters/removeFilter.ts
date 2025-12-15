import { log } from '@unchainedshop/logger';
import { FilterNotFoundError, InvalidIdError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function removeFilter(
  _root: never,
  { filterId }: { filterId: string },
  context: Context,
) {
  const { modules, services, userId } = context;
  log(`mutation removeFilter ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  const filter = await modules.filters.findFilter({ filterId });
  if (!filter) throw new FilterNotFoundError({ filterId });

  return services.filters.removeFilter({ filter });
}
