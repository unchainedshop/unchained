import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { InvalidIdError, AssortmentNotFoundError } from '../../errors';

export default function (root, { texts, assortmentId }, { userId }) {
  log(`mutation updateAssortmentTexts ${assortmentId}`, { userId });
  if (!assortmentId) throw new InvalidIdError({ assortmentId });
  const assortmentObject = Assortments.findOne({ _id: assortmentId });
  if (!assortmentObject) throw new AssortmentNotFoundError({ assortmentId });
  const changedLocalizations = texts.map(({ locale, ...localizations }) =>
    assortmentObject.upsertLocalizedText(locale, {
      ...localizations,
      authorId: userId,
    }),
  );
  return changedLocalizations;
}
