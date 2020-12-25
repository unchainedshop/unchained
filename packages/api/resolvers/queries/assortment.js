import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { InvalidIdError, AssortmentNotFoundError } from '../../errors';

export default function assortment(root, { assortmentId, slug }, { userId }) {
  log(`query assortment ${assortmentId} ${slug}`, { userId });

  if (!assortmentId === !slug) throw new InvalidIdError({ assortmentId, slug });

  const foundAssortment = Assortments.findAssortmentById({
    assortmentId,
    slug,
  });

  if (!foundAssortment)
    throw new AssortmentNotFoundError({ assortmentId, slug });

  return foundAssortment;
}
