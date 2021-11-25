import { log } from 'meteor/unchained:logger';
import { Countries } from 'meteor/unchained:core-countries';
import { CountryNotFoundError, InvalidIdError } from '../../errors';

export default function updateCountry(
  root,
  { country, countryId },
  { userId }
) {
  log(`mutation updateCountry ${countryId}`, { userId });
  if (!countryId) throw new InvalidIdError({ countryId });
  if (!Countries.countryExists({ countryId }))
    throw new CountryNotFoundError({ countryId });
  Countries.updateCountry({ countryId, country });
  return Countries.findCountry({ countryId });
}
