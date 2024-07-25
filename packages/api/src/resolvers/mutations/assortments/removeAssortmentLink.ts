import { log } from '@unchainedshop/logger';
import { AssortmentLinkNotFoundError, InvalidIdError } from '../../../errors.js';
import { Context } from '../../../types.js';

export default async function removeAssortmentLink(
  root: never,
  { assortmentLinkId }: { assortmentLinkId: string },
  { modules, userId }: Context,
) {
  log(`mutation removeAssortmentLink ${assortmentLinkId}`, { userId });
  if (!assortmentLinkId) throw new InvalidIdError({ assortmentLinkId });

  const assortmentLink = await modules.assortments.links.findLink({
    assortmentLinkId,
  });

  if (!assortmentLink) throw new AssortmentLinkNotFoundError({ assortmentLinkId });

  await modules.assortments.links.delete(assortmentLinkId);

  return assortmentLink;
}
