import { log } from 'meteor/unchained:core-logger';
import { AssortmentTexts } from 'meteor/unchained:core-assortments';

export default function translatedAssortmentTexts(
  root,
  { assortmentId },
  { userId },
) {
  log(`query translatedAssortmentTexts ${assortmentId}`, { userId });
  const selector = { assortmentId };
  return AssortmentTexts.find(selector).fetch();
}
