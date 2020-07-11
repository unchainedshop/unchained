import { log } from 'meteor/unchained:core-logger';
import { AssortmentLinks } from 'meteor/unchained:core-assortments';
import { AssortmentLinkNotFoundError } from '../../errors';

export default function (root, { assortmentLinkId }, { userId }) {
  log(`mutation removeAssortmentLink ${assortmentLinkId}`, { userId });
  if (!assortmentLinkId) throw new Error('Invalid assortment link ID provided');
  const assortmentLink = AssortmentLinks.findOne({ _id: assortmentLinkId });
  if (!assortmentLink)
    throw new AssortmentLinkNotFoundError({ assortmentLinkId });
  AssortmentLinks.remove({ _id: assortmentLinkId });
  return assortmentLink;
}
