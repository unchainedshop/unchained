import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';
import { AssortmentNotFoundError } from '../../errors';

export default function (root, { assortmentId, slug }, { userId }) {
  log(`query assortment ${assortmentId} ${slug}`, { userId });
  if (!assortmentId === !slug) {
    throw new Error('please choose either a assortmentId or a slug');
  }
  let assortment = null;

  if (assortmentId) {
    assortment = Assortments.findOne({ _id: assortmentId });
  } else {
    assortment = Assortments.findOne({ slugs: slug });
  }
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId, slug });

  return assortment;
}
