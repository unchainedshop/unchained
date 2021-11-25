import { log } from 'meteor/unchained:logger';
import { Countries } from 'meteor/unchained:core-countries';

export default function countries(
  root,
  { limit, offset, includeInactive },
  { userId }
) {
  log(
    `query countries: ${limit} ${offset} ${
      includeInactive ? 'includeInactive' : ''
    }`,
    { userId }
  );
  return Countries.findCountries({ limit, offset, includeInactive });
}
