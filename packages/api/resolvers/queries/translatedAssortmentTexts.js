import { log } from 'unchained-logger';
import { AssortmentTexts } from 'meteor/unchained:core-assortments';

export default function translatedAssortmentTexts(
  root,
  { assortmentId },
  { userId }
) {
  log(`query translatedAssortmentTexts ${assortmentId}`, { userId });
  return AssortmentTexts.findAssortmentTexts({ assortmentId });
}
