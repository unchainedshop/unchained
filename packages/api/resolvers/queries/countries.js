import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';

export default function (root, { limit, offset, includeInactive }, { userId }) {
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
  const countries = Countries.find(selector, { skip: offset, limit }).fetch();
  return countries;
}
