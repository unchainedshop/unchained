import { log } from 'meteor/unchained:logger';
import { Languages } from 'meteor/unchained:core-languages';
import { InvalidIdError } from '../../errors';

export default function language(root, { languageId }, { userId }) {
  log(`query language ${languageId}`, { userId });
  if (!languageId) throw new InvalidIdError({ languageId });
  return Languages.findLanguage({ languageId });
}
