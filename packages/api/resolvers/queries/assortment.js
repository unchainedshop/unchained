import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';

export default function assortment(root, { assortmentId, slug }, { userId }) {
  log(`query assortment ${assortmentId} ${slug}`, { userId });
  if (!assortmentId === !slug) {
    throw new Error('please choose either a assortmentId or a slug');
  }
  if (assortmentId) {
    return Assortments.findOne({ _id: assortmentId });
  }
  return Assortments.findOne({ slugs: slug });
}
