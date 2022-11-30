import { GetUserCountryService } from '@unchainedshop/types/user';

export const getUserCountryService: GetUserCountryService = async (user, { localeContext, modules }) => {
  const userLocale = localeContext || modules.users.userLocale(user);

  return modules.countries.findCountry({
    isoCode: userLocale.country.toUpperCase(),
  });
};
