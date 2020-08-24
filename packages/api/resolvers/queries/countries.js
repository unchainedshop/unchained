import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';

export default function countries(
  root,
  { limit, offset, includeInactive },
  { userId },
) {
  log(
    `query countries: ${limit} ${offset} ${
      includeInactive ? 'includeInactive' : ''
    }`,
    { userId },
  );
  const selector = {};
  if (!includeInactive) {
    selector.isActive = true;
  }
  return Countries.find(selector, { skip: offset, limit }).fetch();
}
