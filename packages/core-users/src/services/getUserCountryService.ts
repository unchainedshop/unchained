import { GetUserCountryService } from '@unchainedshop/types/user';

export const getUserCountryService: GetUserCountryService = async (user, { modules }) => {
  const userLocale = modules.users.userLocale(user);
  return modules.countries.findCountry({
    isoCode: userLocale.country.toUpperCase(),
  });
};
