import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';

export default function (root, { limit = 10, offset = 0, includeInactive = false }, { userId }) {
  log(`query countries: ${limit} ${offset} ${includeInactive ? 'includeInactive' : ''}`, { userId });
  const selector = { };
  if (!includeInactive) {
    selector.isActive = true;
  }
  const countries = Countries.find(selector, { skip: offset, limit }).fetch();
  return countries;
}
