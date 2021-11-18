import { log } from 'unchained-logger';
import { Languages } from 'meteor/unchained:core-languages';
import { LanguageNotFoundError, InvalidIdError } from '../../errors';

export default function updateLanguage(
  root,
  { language, languageId },
  { userId }
) {
  log(`mutation updateLanguage ${languageId}`, { userId });
  if (!languageId) throw new InvalidIdError({ languageId });
  if (!Languages.languageExists({ languageId }))
    throw new LanguageNotFoundError({ languageId });
  Languages.updateLanguage({ languageId, language });
  return Languages.findLanguage({ languageId });
}
