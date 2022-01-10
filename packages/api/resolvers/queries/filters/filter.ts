import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { InvalidIdError } from '../../../errors';

export default async function filter(
  root: Root,
  { filterId }: { filterId: string },
  { modules, userId }: Context
) {
  log(`query filter ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });

  return await modules.filters.findFilter({ filterId });
}
