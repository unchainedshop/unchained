import { log } from 'meteor/unchained:core-logger';
import { Languages } from 'meteor/unchained:core-languages';
import { LanguageNotFoundError, InvalidIdError } from '../../errors';

export default function language(root, { languageId }, { userId }) {
  log(`query language ${languageId}`, { userId });
  if (!languageId) throw new InvalidIdError({ languageId });
  const foundLanguage = Languages.findLanguage({ languageId });
  if (!foundLanguage) throw new LanguageNotFoundError({ languageId });
  return foundLanguage;
}
