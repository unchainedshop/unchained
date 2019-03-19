import { log } from 'meteor/unchained:core-logger';
import { Languages } from 'meteor/unchained:core-languages';

export default function(root, { language: inputData }, { userId }) {
  log('mutation createLanguage', { userId });
  const { isoCode } = inputData;
  const language = { created: new Date() };
  language.authorId = userId;
  language.isoCode = isoCode;
  language.isActive = true;
  language.isBase = false;
  const languageId = Languages.insert(language);
  const languageObject = Languages.findOne({ _id: languageId });
  return languageObject;
}
