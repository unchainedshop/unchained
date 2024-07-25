import { log } from '@unchainedshop/logger';
import { Country } from '@unchainedshop/types/countries.js';
import { CountryNotFoundError, InvalidIdError } from '../../../errors.js';
import { Context } from '../../../types.js';

export default async function updateCountry(
  root: never,
  { country, countryId }: { country: Country & { defaultCurrencyId: string }; countryId: string },
  { userId, modules }: Context,
) {
  log(`mutation updateCountry ${countryId}`, { userId });

  if (!countryId) throw new InvalidIdError({ countryId });

  if (!(await modules.countries.countryExists({ countryId })))
    throw new CountryNotFoundError({ countryId });

  const currencyObject = await modules.currencies.findCurrency({
    currencyId: country.defaultCurrencyId,
  });
  const defaultCurrencyCode = country?.defaultCurrencyCode || currencyObject?.isoCode;

  await modules.countries.update(countryId, { ...country, defaultCurrencyCode });

  return modules.countries.findCountry({ countryId });
}
