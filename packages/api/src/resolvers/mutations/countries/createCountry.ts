import { log } from '@unchainedshop/logger';
import { Country } from '@unchainedshop/core-countries';
import { Context } from '../../../context.js';

export default async function createCountry(
  root: never,
  { country }: { country: Country },
  { userId, modules }: Context,
) {
  log('mutation createCountry', { userId });

  const countryId = await modules.countries.create({
    ...country,
  });

  return modules.countries.findCountry({ countryId });
}
