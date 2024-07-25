import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.js';
import { Context } from '../../../types.js';

export default async function country(
  root: never,
  { countryId }: { countryId: string },
  { modules, userId }: Context,
) {
  log(`query country ${countryId}`, { userId });

  if (!countryId) throw new InvalidIdError({ countryId });
  return modules.countries.findCountry({ countryId });
}
