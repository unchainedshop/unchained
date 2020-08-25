import { log } from 'meteor/unchained:core-logger';
import { AssortmentLinks } from 'meteor/unchained:core-assortments';
import { AssortmentLinkNotFoundError, InvalidIdError } from '../../errors';

export default function removeAssortmentLink(
  root,
  { assortmentLinkId },
  { userId },
) {
  log(`mutation removeAssortmentLink ${assortmentLinkId}`, { userId });
  if (!assortmentLinkId) throw new InvalidIdError({ assortmentLinkId });
  const assortmentLink = AssortmentLinks.findOne({ _id: assortmentLinkId });
  if (!assortmentLink)
    throw new AssortmentLinkNotFoundError({ assortmentLinkId });
  AssortmentLinks.remove({ _id: assortmentLinkId });
  return assortmentLink;
}
