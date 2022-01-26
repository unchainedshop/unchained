import { GetUserLanguageService } from '@unchainedshop/types/user';

export const getUserLanguageService: GetUserLanguageService = async (
  user,
  params,
  { modules }
) => {
  const userLocale = modules.users.userLocale(user, params);

  return modules.languages.findLanguage({
    isoCode: userLocale.language,
  });
};
