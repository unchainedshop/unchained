import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';
import { CountryNotFoundError, InvalidIdError } from '../../errors';

export default function setBaseCountry(root, { countryId }, { userId }) {
  log(`mutation setBaseCountry ${countryId}`, { userId });
  if (!countryId) throw new InvalidIdError({ countryId });
  Countries.update(
    { isBase: true },
    {
      $set: {
        isBase: false,
        updated: new Date(),
      },
    },
    { multi: true },
  );
  Countries.update(
    { _id: countryId },
    {
      $set: {
        isBase: true,
        updated: new Date(),
      },
    },
  );
  const country = Countries.findOne({ _id: countryId });
  if (!country) throw new CountryNotFoundError({ countryId });
  return country;
}
