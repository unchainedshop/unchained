import { log } from 'meteor/unchained:logger';
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

  return Assortments.findAssortments({
    tags,
    slugs,
    limit,
    offset,
    includeInactive,
    includeLeaves,
  });
}
