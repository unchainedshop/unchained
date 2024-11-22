import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function filter(
  root: never,
  { filterId }: { filterId: string },
  { modules, userId }: Context,
) {
  log(`query filter ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  return modules.filters.findFilter({ filterId });
}
