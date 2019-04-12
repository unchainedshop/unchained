import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';

export default function(
  root,
  { limit, offset, includeInactive, includeLeaves },
  { userId }
) {
  log(
    `query assortments: ${limit} ${offset} ${
      includeInactive ? 'includeInactive' : ''
    }`,
    { userId }
  );
  const selector = {};
  if (!includeLeaves) {
    selector.isRoot = true;
  }
  if (!includeInactive) {
    selector.isActive = true;
  }
  const assortments = Assortments.find(selector, {
    skip: offset,
    limit
  }).fetch();
  return assortments;
}
