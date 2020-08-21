import { log } from 'meteor/unchained:core-logger';
import { Languages } from 'meteor/unchained:core-languages';
import { LanguageNotFoundError, InvalidIdError } from '../../errors';

export default function (root, { languageId }, { userId }) {
  log(`query language ${languageId}`, { userId });

  if (!languageId) throw new InvalidIdError({ languageId });
  const selector = {};
  selector._id = languageId;
  const language = Languages.findOne(selector);
  if (!language) throw new LanguageNotFoundError({ languageId });

  return language;
}
