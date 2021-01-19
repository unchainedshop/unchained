import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { InvalidIdError } from '../../errors';

export default function assortment(root, { assortmentId, slug }, { userId }) {
  log(`query assortment ${assortmentId} ${slug}`, { userId });

  if (!assortmentId === !slug) throw new InvalidIdError({ assortmentId, slug });
  return Assortments.findAssortment({
    assortmentId,
    slug,
  });
}
