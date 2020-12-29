import { log } from 'meteor/unchained:core-logger';
import { Languages } from 'meteor/unchained:core-languages';
import { LanguageNotFoundError, InvalidIdError } from '../../errors';

export default function setBaseLanguage(root, { languageId }, { userId }) {
  log(`mutation setBaseLanguage ${languageId}`, { userId });
  if (!languageId) throw new InvalidIdError({ languageId });
  const language = Languages.findLanguage({ languageId });
  if (!language) throw new LanguageNotFoundError({ languageId });
  return Languages.setBase({ languageId });
}
