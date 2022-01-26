import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { AssortmentLinkNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeAssortmentLink(
  root: Root,
  { assortmentLinkId }: { assortmentLinkId: string },
  { modules, userId }: Context,
) {
  log(`mutation removeAssortmentLink ${assortmentLinkId}`, { modules, userId });
  if (!assortmentLinkId) throw new InvalidIdError({ assortmentLinkId });

  const assortmentLink = await modules.assortments.links.findLink({
    assortmentLinkId,
  });

  if (!assortmentLink) throw new AssortmentLinkNotFoundError({ assortmentLinkId });

  await modules.assortments.links.delete(assortmentLinkId, { skipInvalidation: false }, userId);

  return assortmentLink;
}
