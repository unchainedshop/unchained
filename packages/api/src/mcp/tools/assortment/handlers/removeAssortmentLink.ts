import { Context } from '../../../../context.js';

import { Params } from '../schemas.js';

export default async function removeAssortmentLink(context: Context, params: Params<'REMOVE_LINK'>) {
  const { modules } = context;
  const { assortmentLinkId } = params;

  const existing = await modules.assortments.links.findLink({ assortmentLinkId });
  if (!existing) throw new Error(`Assortment link not found: ${assortmentLinkId}`);

  const deletedAssortmentLink = await modules.assortments.links.delete(assortmentLinkId);
  return { success: Boolean(deletedAssortmentLink) };
}
