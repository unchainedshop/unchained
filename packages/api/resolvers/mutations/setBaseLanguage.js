import { log } from "meteor/unchained:core-logger";
import { Languages } from "meteor/unchained:core-languages";

export default function setBaseLanguage(root, { languageId }, { userId }) {
  log(`mutation setBaseLanguage ${languageId}`, { userId });
  Languages.update(
    { isBase: true },
    {
      $set: {
        isBase: false,
        updated: new Date()
      }
    },
    { multi: true }
  );
  Languages.update(
    { _id: languageId },
    {
      $set: {
        isBase: true,
        updated: new Date()
      }
    }
  );
  return Languages.findOne({ _id: languageId });
}
