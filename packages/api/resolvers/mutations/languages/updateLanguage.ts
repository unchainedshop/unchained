import { Context, Root } from '@unchainedshop/types/api';
import { Language } from '@unchainedshop/types/languages';
import { log } from 'meteor/unchained:logger';
import { InvalidIdError, LanguageNotFoundError } from '../../../errors';

export default async function updateLanguage(
  root: Root,
  { language, languageId }: { language: Language; languageId: string },
  { userId, modules }: Context
) {
  log(`mutation updateLanguage ${languageId}`, { userId });

  if (!languageId) throw new InvalidIdError({ languageId });

  if (!(await modules.languages.languageExists({ languageId })))
    throw new LanguageNotFoundError({ languageId });

  await modules.languages.update(languageId, language, userId);

  return modules.languages.findLanguage({ languageId });
}
