import { Context } from '../../../context.js';
import { Language } from '@unchainedshop/core-languages';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, LanguageNotFoundError } from '../../../errors.js';

export default async function updateLanguage(
  root: never,
  { language, languageId }: { language: Language; languageId: string },
  { userId, modules }: Context,
) {
  log(`mutation updateLanguage ${languageId}`, { userId });

  if (!languageId) throw new InvalidIdError({ languageId });

  if (!(await modules.languages.languageExists({ languageId })))
    throw new LanguageNotFoundError({ languageId });

  await modules.languages.update(languageId, language);

  return modules.languages.findLanguage({ languageId });
}
