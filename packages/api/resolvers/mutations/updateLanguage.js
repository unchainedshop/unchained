import { log } from 'meteor/unchained:core-logger';
import { Languages } from 'meteor/unchained:core-languages';
import { LanguageNotFoundError, InvalidIdError } from '../../errors';

export default function updateLanguage(
  root,
  { language, languageId },
  { userId }
) {
  log(`mutation updateLanguage ${languageId}`, { userId });
  if (!languageId) throw new InvalidIdError({ languageId });
  const languageObject = Languages.findLanguage({ languageId });
  if (!languageObject) throw new LanguageNotFoundError({ languageId });
  return Languages.updateLanguage({ languageId, language });
}
