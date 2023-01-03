import { GetUserCountryService } from '@unchainedshop/types/user.js';

export const getUserCountryService: GetUserCountryService = async (user, { modules }) => {
  const userLocale = modules.users.userLocale(user);
  return modules.countries.findCountry({
    isoCode: userLocale.country.toUpperCase(),
  });
};
