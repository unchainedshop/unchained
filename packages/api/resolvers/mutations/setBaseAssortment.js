import { log } from 'unchained-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { AssortmentNotFoundError, InvalidIdError } from '../../errors';

export default function setBaseAssortment(root, { assortmentId }, { userId }) {
  log(`mutation setBaseAssortment ${assortmentId}`, { userId });
  if (!assortmentId) throw new InvalidIdError({ assortmentId });

  if (!Assortments.assortmentExists({ assortmentId }))
    throw new AssortmentNotFoundError({ assortmentId });
  Assortments.setBase({ assortmentId });
  return Assortments.findAssortment({ assortmentId });
}
