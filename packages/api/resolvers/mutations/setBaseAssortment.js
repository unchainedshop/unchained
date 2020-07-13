import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { AssortmentNotFoundError } from '../../errors';

export default function setBaseAssortment(root, { assortmentId }, { userId }) {
  log(`mutation setBaseAssortment ${assortmentId}`, { userId });
  if (!assortmentId) throw new Error('Invalid assortment ID provided');
  Assortments.update(
    { isBase: true },
    {
      $set: {
        isBase: false,
        updated: new Date(),
      },
    },
    { multi: true },
  );
  Assortments.update(
    { _id: assortmentId },
    {
      $set: {
        isBase: true,
        updated: new Date(),
      },
    },
  );
  const assortment = Assortments.findOne({ _id: assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });
  return assortment;
}
