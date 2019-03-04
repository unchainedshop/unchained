import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';

export default function(root, { countryId }, { userId }) {
  log(`mutation removeCountry ${countryId}`, { userId });
  const country = Countries.findOne({ _id: countryId });
  Countries.remove({ _id: countryId });
  return country;
}
