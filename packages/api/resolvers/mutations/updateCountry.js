import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';
import { CountryNotFoundError } from '../../errors';

export default function (root, { country, countryId }, { userId }) {
  log(`mutation updateCountry ${countryId}`, { userId });
  if (!countryId) throw new Error('Invalid country ID provided');
  const countryObject = Countries.findOne({ _id: countryId });
  if (!countryObject) throw new CountryNotFoundError({ countryId });
  Countries.update(
    { _id: countryId },
    {
      $set: {
        ...country,
        updated: new Date(),
      },
    },
  );
  return Countries.findOne({ _id: countryId });
}
