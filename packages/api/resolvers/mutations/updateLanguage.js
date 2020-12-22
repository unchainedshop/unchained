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
  const languageObject = Languages.findOne({ _id: languageId });
  if (!languageObject) throw new LanguageNotFoundError({ languageId });
  return languageObject.updateLanguage({ language });
}
