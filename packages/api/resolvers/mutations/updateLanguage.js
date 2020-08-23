import { log } from 'meteor/unchained:core-logger';
import { Languages } from 'meteor/unchained:core-languages';

export default function updateLanguage(
  root,
  { language, languageId },
  { userId },
) {
  log(`mutation updateLanguage ${languageId}`, { userId });
  Languages.update(
    { _id: languageId },
    {
      updated: new Date(),
      $set: language,
    },
  );
  return Languages.findOne({ _id: languageId });
}
