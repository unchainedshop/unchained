import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { AssortmentNotFoundError } from '../../errors';

export default function (root, { assortment, assortmentId }, { userId }) {
  log(`mutation updateAssortment ${assortmentId}`, { userId });
  if (!assortmentId) throw new Error('Invalid assortment ID provided');
  const assort = Assortments.findOne({ _id: assortmentId });
  if (!assort) throw new AssortmentNotFoundError({ assortmentId });
  Assortments.update(
    { _id: assortmentId },
    {
      $set: {
        ...assortment,
        updated: new Date(),
      },
    },
  );
  return Assortments.findOne({ _id: assortmentId });
}
