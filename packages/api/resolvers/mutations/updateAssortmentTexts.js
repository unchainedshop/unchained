import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';

export default function (root, { texts, assortmentId }, { userId }) {
  log(`mutation updateAssortmentTexts ${assortmentId}`, { userId });
  if (!assortmentId) throw new Error('Invalid assortment ID provided');
  const assortmentObject = Assortments.findOne({ _id: assortmentId });
  const changedLocalizations = texts.map(({ locale, ...localizations }) =>
    assortmentObject.upsertLocalizedText(locale, localizations),
  );
  return changedLocalizations;
}
