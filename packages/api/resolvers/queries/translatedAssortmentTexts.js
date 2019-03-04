import { log } from "meteor/unchained:core-logger";
import { AssortmentTexts } from "meteor/unchained:core-assortments";

export default function(root, { assortmentId }, { userId }) {
  log(`query translatedAssortmentTexts ${assortmentId}`, { userId });
  const selector = { assortmentId };
  const assortmentTexts = AssortmentTexts.find(selector).fetch();
  return assortmentTexts;
}
