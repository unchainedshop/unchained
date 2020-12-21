import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';
import { CountryNotFoundError, InvalidIdError } from '../../errors';

export default function setBaseCountry(root, { countryId }, { userId }) {
  log(`mutation setBaseCountry ${countryId}`, { userId });
  if (!countryId) throw new InvalidIdError({ countryId });
  const country = Countries.findOne({ _id: countryId });
  if (!country) throw new CountryNotFoundError({ countryId });
  return country.makeBase();
}
