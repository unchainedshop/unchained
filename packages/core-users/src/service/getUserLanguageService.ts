import { Context } from '@unchainedshop/types/api';
import { Language } from '@unchainedshop/types/languages';
import { User } from '@unchainedshop/types/user';
import { Locale } from 'locale';

export type GetUserLanguageService = (
  user: User,
  params: { localeContext?: Locale },
  context: Context
) => Promise<Language>;

export const getUserLanguageService: GetUserLanguageService = async (
  user,
  params,
  { modules }
) => {
  const userLocale = modules.users.userLocale(user, params);

  return await modules.languages.findLanguage({
    isoCode: userLocale.language,
  });
};
