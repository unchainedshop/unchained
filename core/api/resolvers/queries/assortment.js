import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';

export default function (root, { assortmentId }, { userId }) {
  log(`query assortment ${assortmentId}`, { userId });
  const selector = { };
  selector._id = assortmentId;
  const assortment = Assortments.findOne(selector);
  return assortment;
}
