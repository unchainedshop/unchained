import { Context } from '@unchainedshop/types/api';
import { Country } from '@unchainedshop/types/countries';
import { User } from '@unchainedshop/types/user';
import { Locale } from 'locale';

export type GetUserCountryService = (
  user: User,
  params: { localeContext?: Locale },
  context: Context
) => Promise<Country>;

export const getUserCountryService: GetUserCountryService = async (
  user,
  params,
  { modules }
) => {
  const userLocale = modules.users.userLocale(user, params);

  return await modules.countries.findCountry({
    isoCode: userLocale.country.toUpperCase(),
  });
};
