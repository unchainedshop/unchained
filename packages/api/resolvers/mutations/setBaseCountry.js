import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';

export default function setBaseCountry(root, { countryId }, { userId }) {
  log(`mutation setBaseCountry ${countryId}`, { userId });
  Countries.update(
    { isBase: true },
    {
      $set: {
        isBase: false,
        updated: new Date(),
      },
    },
    { multi: true }
  );
  Countries.update(
    { _id: countryId },
    {
      $set: {
        isBase: true,
        updated: new Date(),
      },
    }
  );
  return Countries.findOne({ _id: countryId });
}
