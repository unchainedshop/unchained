import { log } from 'meteor/unchained:core-logger';
import { Languages } from 'meteor/unchained:core-languages';

export default function language(root, { languageId }, { userId }) {
  log(`query language ${languageId}`, { userId });
  const selector = {};
  selector._id = languageId;
  return Languages.findOne(selector);
}
