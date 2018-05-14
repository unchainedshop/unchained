import { log } from 'meteor/unchained:core-logger';
import { Languages } from 'meteor/unchained:core-languages';

export default function (root, { languageId }, { userId }) {
  log(`mutation removeLanguage ${languageId}`, { userId });
  const language = Languages.findOne({ _id: languageId });
  Languages.remove({ _id: languageId });
  return language;
}
