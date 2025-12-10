import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function filter(
  root: never,
  { filterId }: { filterId: string },
  { modules, userId }: Context,
) {
  log(`query filter ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  return modules.filters.findFilter({ filterId });
}
