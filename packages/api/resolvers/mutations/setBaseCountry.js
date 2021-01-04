import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';
import { CountryNotFoundError, InvalidIdError } from '../../errors';

export default function setBaseCountry(root, { countryId }, { userId }) {
  log(`mutation setBaseCountry ${countryId}`, { userId });
  if (!countryId) throw new InvalidIdError({ countryId });
  if (!Countries.countryExists({ countryId }))
    throw new CountryNotFoundError({ countryId });
  Countries.setBase({ countryId });
  return Countries.findCountry({ countryId });
}
