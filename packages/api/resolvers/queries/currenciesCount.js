import { log } from 'unchained-logger';
import { Currencies } from 'meteor/unchained:core-currencies';

export default function currenciesCount(root, { includeInactive }, { userId }) {
  log(`query currenciesCount: ${includeInactive ? 'includeInactive' : ''}`, {
    userId,
  });
  return Currencies.count({ includeInactive });
}
