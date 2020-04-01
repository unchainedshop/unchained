import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';

export default function (root, { countryId }, { userId }) {
  log(`query country ${countryId}`, { userId });
  const selector = {};
  selector._id = countryId;
  const country = Countries.findOne(selector);
  return country;
}
