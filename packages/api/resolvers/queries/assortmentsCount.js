import { log } from 'unchained-logger';
import { Assortments } from 'meteor/unchained:core-assortments';

export default function assortmentsCount(
  root,
  { tags, slugs, includeInactive, includeLeaves },
  { userId }
) {
  log(
    `query assortmentsCount: ${
      includeInactive ? 'includeInactive' : ''
    } ${slugs?.join(',')}`,
    { userId }
  );

  return Assortments.count({
    tags,
    slugs,
    includeInactive,
    includeLeaves,
  });
}
