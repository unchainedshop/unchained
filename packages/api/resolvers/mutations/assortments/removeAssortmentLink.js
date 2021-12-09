import { log } from 'meteor/unchained:logger';
import { AssortmentLinks } from 'meteor/unchained:core-assortments';
import { AssortmentLinkNotFoundError, InvalidIdError } from '../../errors';

export default function removeAssortmentLink(
  root,
  { assortmentLinkId },
  { userId }
) {
  log(`mutation removeAssortmentLink ${assortmentLinkId}`, { userId });
  if (!assortmentLinkId) throw new InvalidIdError({ assortmentLinkId });
  const assortmentLink = AssortmentLinks.findLink({ assortmentLinkId });
  if (!assortmentLink)
    throw new AssortmentLinkNotFoundError({ assortmentLinkId });
  AssortmentLinks.removeLink({ assortmentLinkId });
  return assortmentLink;
}
