import { log } from '@unchainedshop/logger';
import { Country } from '@unchainedshop/types/countries.js';
import { Context, Root } from '@unchainedshop/types/api.js';
import { CountryNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function updateCountry(
  root: Root,
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
