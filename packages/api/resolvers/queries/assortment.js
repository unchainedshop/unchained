import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { InvalidIdError, AssortmentNotFoundError } from '../../errors';

export default function (root, { assortmentId, slug }, { userId }) {
  log(`query assortment ${assortmentId} ${slug}`, { userId });
  if (!assortmentId === !slug) throw new InvalidIdError({ assortmentId, slug });
  let assortment;
  if (assortmentId) assortment = Assortments.findOne({ _id: assortmentId });
  else assortment = Assortments.findOne({ slugs: slug });

  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  return assortment;
}
