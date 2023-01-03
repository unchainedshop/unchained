import { log } from '@unchainedshop/logger';
import { Country } from '@unchainedshop/types/countries.js';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function createCountry(
  root: Root,
  { country }: { country: Country },
  { userId, modules }: Context,
) {
  log('mutation createCountry', { userId });

  const countryId = await modules.countries.create({
    ...country,
  });

  return modules.countries.findCountry({ countryId });
}
