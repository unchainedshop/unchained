import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';

export default function updateAssortmentTexts(
  root,
  { texts, assortmentId },
  { userId },
) {
  log(`mutation updateAssortmentTexts ${assortmentId}`, { userId });
  const assortmentObject = Assortments.findOne({ _id: assortmentId });
  const changedLocalizations = texts.map(({ locale, ...localizations }) =>
    assortmentObject.upsertLocalizedText(locale, {
      ...localizations,
      authorId: userId,
    }),
  );
  return changedLocalizations;
}
