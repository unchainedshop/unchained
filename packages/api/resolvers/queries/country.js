import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';

export default function country(root, { countryId }, { userId }) {
  log(`query country ${countryId}`, { userId });
  const selector = {};
  selector._id = countryId;
  return Countries.findOne(selector);
}
