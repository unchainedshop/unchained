import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';
import { CountryNotFoundError, InvalidIdError } from '../../errors';

export default function (root, { countryId }, { userId }) {
  log(`query country ${countryId}`, { userId });
  if (!countryId) throw new InvalidIdError({ countryId });

  const selector = {};
  selector._id = countryId;
  const country = Countries.findOne(selector);

  if (!country) throw new CountryNotFoundError({ countryId });

  return country;
}
