import { log } from 'unchained-logger';
import { Languages } from 'meteor/unchained:core-languages';
import { LanguageNotFoundError, InvalidIdError } from '../../errors';

export default function removeLanguage(root, { languageId }, { userId }) {
  log(`mutation removeLanguage ${languageId}`, { userId });
  if (!languageId) throw new InvalidIdError({ languageId });
  const language = Languages.findLanguage({ languageId });
  if (!language) throw new LanguageNotFoundError({ languageId });
  Languages.removeLanguage({ languageId });
  return language;
}
