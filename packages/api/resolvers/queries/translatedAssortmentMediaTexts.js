import { log } from 'meteor/unchained:logger';
import { AssortmentMediaTexts } from 'meteor/unchained:core-assortments';

export default function translatedAssortmentMediaTexts(
  root,
  { assortmentMediaId },
  { userId }
) {
  log(`query translatedAssortmentMediaTexts ${assortmentMediaId}`, { userId });
  return AssortmentMediaTexts.findAssortmentMediaTexts({ assortmentMediaId });
}
