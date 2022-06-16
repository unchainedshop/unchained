import { log } from '@unchainedshop/logger';
import { Country } from '@unchainedshop/types/countries';
import { Context, Root } from '@unchainedshop/types/api';
import { CountryNotFoundError, InvalidIdError } from '../../../errors';

export default async function updateCountry(
  root: Root,
  { country, countryId }: { country: Country; countryId: string },
  { userId, modules }: Context,
) {
  log(`mutation updateCountry ${countryId}`, { userId });

  if (!countryId) throw new InvalidIdError({ countryId });

  if (!(await modules.countries.countryExists({ countryId })))
    throw new CountryNotFoundError({ countryId });

  await modules.countries.update(countryId, country, userId);

  return modules.countries.findCountry({ countryId });
}
