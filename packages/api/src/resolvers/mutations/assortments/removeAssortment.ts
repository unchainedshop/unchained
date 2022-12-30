import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { AssortmentNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function removeAssortment(
  root: Root,
  { assortmentId }: { assortmentId: string },
  { modules, userId }: Context,
) {
  log(`mutation removeAssortment ${assortmentId}`, { userId });

  if (!assortmentId) throw new InvalidIdError({ assortmentId });

  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  await modules.assortments.delete(assortmentId, { skipInvalidation: false });

  return assortment;
}
