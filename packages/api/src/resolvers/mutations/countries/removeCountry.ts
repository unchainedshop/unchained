import { Context, Root } from '@unchainedshop/types/api';
import { log } from '@unchainedshop/logger';
import { CountryNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeCountry(
  root: Root,
  { countryId }: { countryId: string },
  { userId, modules }: Context,
) {
  log(`mutation removeCountry ${countryId}`, { userId });

  if (!countryId) throw new InvalidIdError({ countryId });

  if (!(await modules.countries.countryExists({ countryId })))
    throw new CountryNotFoundError({ countryId });

  await modules.countries.delete(countryId, userId);

  return modules.countries.findCountry({ countryId });
}
