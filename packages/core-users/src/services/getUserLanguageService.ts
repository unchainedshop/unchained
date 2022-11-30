import { GetUserLanguageService } from '@unchainedshop/types/user';

export const getUserLanguageService: GetUserLanguageService = async (user, params, { modules }) => {
  const userLocale = params.localeContext || modules.users.userLocale(user);

  return modules.languages.findLanguage({
    isoCode: userLocale.language,
  });
};
