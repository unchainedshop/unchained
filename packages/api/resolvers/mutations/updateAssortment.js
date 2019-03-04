import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';

export default function(root, { assortment, assortmentId }, { userId }) {
  log(`mutation updateAssortment ${assortmentId}`, { userId });
  Assortments.update(
    { _id: assortmentId },
    {
      $set: {
        ...assortment,
        updated: new Date()
      }
    }
  );
  return Assortments.findOne({ _id: assortmentId });
}
