import { log } from '@unchainedshop/logger';
import { Country } from '@unchainedshop/core-countries';
import { CountryNotFoundError, InvalidIdError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function updateCountry(
  root: never,
  { country, countryId }: { country: Country; countryId: string },
  { userId, modules }: Context,
) {
  log(`mutation updateCountry ${countryId}`, { userId });

  if (!countryId) throw new InvalidIdError({ countryId });

  if (!(await modules.countries.countryExists({ countryId })))
    throw new CountryNotFoundError({ countryId });

  await modules.countries.update(countryId, country);

  return modules.countries.findCountry({ countryId });
}
