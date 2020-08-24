import { log } from 'meteor/unchained:core-logger';
import { Languages } from 'meteor/unchained:core-languages';
import { LanguageNotFoundError, InvalidIdError } from '../../errors';

export default function language(root, { languageId }, { userId }) {
  log(`query language ${languageId}`, { userId });
  if (!languageId) throw new InvalidIdError({ languageId });
  const selector = {};
  selector._id = languageId;
  const foundLanguage = Languages.findOne(selector);
  if (!foundLanguage) throw new LanguageNotFoundError({ languageId });
  return foundLanguage;
}
