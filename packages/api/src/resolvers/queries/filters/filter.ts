import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { InvalidIdError } from '../../../errors.js';

export default async function filter(
  root: Root,
  { filterId }: { filterId: string },
  { modules, userId }: Context,
) {
  log(`query filter ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  return modules.filters.findFilter({ filterId });
}
