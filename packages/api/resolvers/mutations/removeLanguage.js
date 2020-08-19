import { log } from 'meteor/unchained:core-logger';
import { Languages } from 'meteor/unchained:core-languages';
import { LanguageNotFoundError, InvalidIdError } from '../../errors';

export default function (root, { languageId }, { userId }) {
  log(`mutation removeLanguage ${languageId}`, { userId });
  if (!languageId) throw new InvalidIdError({ languageId });
  const language = Languages.findOne({ _id: languageId });
  if (!language) throw new LanguageNotFoundError({ languageId });
  Languages.remove({ _id: languageId });
  return language;
}
