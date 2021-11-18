import { log } from 'unchained-logger';
import { Currencies } from 'meteor/unchained:core-currencies';

export default function currencies(
  root,
  { limit, offset, includeInactive },
  { userId }
) {
  log(
    `query currencies: ${limit} ${offset} ${
      includeInactive ? 'includeInactive' : ''
    }`,
    { userId }
  );
  return Currencies.findCurrencies({ limit, offset, includeInactive });
}
