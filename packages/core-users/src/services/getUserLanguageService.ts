import { GetUserLanguageService } from '@unchainedshop/types/user.js';

export const getUserLanguageService: GetUserLanguageService = async (user, { modules }) => {
  const userLocale = modules.users.userLocale(user);
  return modules.languages.findLanguage({
    isoCode: userLocale.language,
  });
};
