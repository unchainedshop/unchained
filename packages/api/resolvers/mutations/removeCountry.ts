import { log } from 'meteor/unchained:logger';
import { CountryNotFoundError, InvalidIdError } from '../../errors';
import { Country } from '@unchainedshop/types/countries';
import { Context, Root } from '@unchainedshop/types/api';

export default async function removeCountry(
  root: Root,
  { countryId }: { countryId: string },
  { userId, modules }: Context
) {
  log(`mutation removeCountry ${countryId}`, { userId });

  if (!countryId) throw new InvalidIdError({ countryId });
  const country = await modules.countries.findCountry({ countryId });
  if (!country) throw new CountryNotFoundError({ countryId });
  await modules.countries.removeCountry({ countryId });
  return country;
}
