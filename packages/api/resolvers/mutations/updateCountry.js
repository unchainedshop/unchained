import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';

export default function (root, { country, countryId }, { userId }) {
  log(`mutation updateCountry ${countryId}`, { userId });
  Countries.update({ _id: countryId }, {
    $set: {
      ...country,
      updated: new Date(),
    },
  });
  return Countries.findOne({ _id: countryId });
}
