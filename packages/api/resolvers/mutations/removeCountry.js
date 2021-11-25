import { log } from 'meteor/unchained:logger';
import { Countries } from 'meteor/unchained:core-countries';
import { CountryNotFoundError, InvalidIdError } from '../../errors';

export default function removeCountry(root, { countryId }, { userId }) {
  log(`mutation removeCountry ${countryId}`, { userId });
  if (!countryId) throw new InvalidIdError({ countryId });
  const country = Countries.findCountry({ countryId });
  if (!country) throw new CountryNotFoundError({ countryId });
  Countries.removeCountry({ countryId });
  return country;
}
