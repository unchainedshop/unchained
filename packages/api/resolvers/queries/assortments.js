import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';

export default function assortments(
  root,
  { tags, slugs, limit, offset, includeInactive, includeLeaves },
  { userId }
) {
  log(
    `query assortments: ${limit} ${offset} ${
      includeInactive ? 'includeInactive' : ''
    } ${slugs?.join(',')}`,
    { userId }
  );

  const selector = {};
  const sort = { sequence: 1 };
  const options = { sort };

  if (slugs?.length > 0) {
    selector.slugs = { $in: slugs };
  } else {
    options.skip = offset;
    options.limit = limit;

    if (tags?.length > 0) {
      selector.tags = { $all: tags };
    }
  }

  if (!includeLeaves) {
    selector.isRoot = true;
  }
  if (!includeInactive) {
    selector.isActive = true;
  }

  return Assortments.find(selector, options).fetch();
}
