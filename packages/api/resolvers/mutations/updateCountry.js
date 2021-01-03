import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';
import { CountryNotFoundError, InvalidIdError } from '../../errors';

export default function updateCountry(
  root,
  { country, countryId },
  { userId }
) {
  log(`mutation updateCountry ${countryId}`, { userId });
  if (!countryId) throw new InvalidIdError({ countryId });
  const countryObject = Countries.findCountry({ countryId });
  if (!countryObject) throw new CountryNotFoundError({ countryId });
  Countries.updateCountry({ countryId, country });
  return Countries.findCountry({ countryId });
}
