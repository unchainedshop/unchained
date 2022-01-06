import { log } from 'meteor/unchained:logger';
import { Filters } from 'meteor/unchained:core-filters';
import { InvalidIdError } from '../../../errors';

export default async function filter(root: Root, { filterId }, { modules, userId }: Context) {
  log(`query filter ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });
  return Filters.findFilter({ filterId });
}
