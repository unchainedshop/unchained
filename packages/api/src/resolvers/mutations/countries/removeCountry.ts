import { log } from '@unchainedshop/logger';
import { CountryNotFoundError, InvalidIdError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function removeCountry(
  root: never,
  { countryId }: { countryId: string },
  { userId, modules }: Context,
) {
  log(`mutation removeCountry ${countryId}`, { userId });

  if (!countryId) throw new InvalidIdError({ countryId });

  if (!(await modules.countries.countryExists({ countryId })))
    throw new CountryNotFoundError({ countryId });

  await modules.countries.delete(countryId);

  return modules.countries.findCountry({ countryId });
}
