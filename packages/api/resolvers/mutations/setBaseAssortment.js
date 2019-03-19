import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';

export default function setBaseAssortment(root, { assortmentId }, { userId }) {
  log(`mutation setBaseAssortment ${assortmentId}`, { userId });
  Assortments.update(
    { isBase: true },
    {
      $set: {
        isBase: false,
        updated: new Date()
      }
    },
    { multi: true }
  );
  Assortments.update(
    { _id: assortmentId },
    {
      $set: {
        isBase: true,
        updated: new Date()
      }
    }
  );
  return Assortments.findOne({ _id: assortmentId });
}
