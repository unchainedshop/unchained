import { GetUserLanguageService } from '@unchainedshop/types/user';

export const getUserLanguageService: GetUserLanguageService = async (
  user,
  { localeContext, modules },
) => {
  const userLocale = localeContext || modules.users.userLocale(user);

  return modules.languages.findLanguage({
    isoCode: userLocale.language,
  });
};
