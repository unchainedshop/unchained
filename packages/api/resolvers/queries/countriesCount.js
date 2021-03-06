import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';

export default function countriesCount(root, { includeInactive }, { userId }) {
  log(`query countriesCount:  ${includeInactive ? 'includeInactive' : ''}`, {
    userId,
  });
  return Countries.count({ includeInactive });
}
