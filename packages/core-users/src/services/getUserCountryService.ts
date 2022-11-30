import { GetUserCountryService } from '@unchainedshop/types/user';

export const getUserCountryService: GetUserCountryService = async (user, params, { modules }) => {
  const userLocale = params.localeContext || modules.users.userLocale(user);

  return modules.countries.findCountry({
    isoCode: userLocale.country.toUpperCase(),
  });
};
