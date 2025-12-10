import { log } from '@unchainedshop/logger';
import { AssortmentNotFoundError, InvalidIdError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function removeAssortment(
  root: never,
  { assortmentId }: { assortmentId: string },
  { modules, userId }: Context,
) {
  log(`mutation removeAssortment ${assortmentId}`, { userId });

  if (!assortmentId) throw new InvalidIdError({ assortmentId });

  const deletedAssortment = await modules.assortments.delete(assortmentId);
  if (!deletedAssortment) throw new AssortmentNotFoundError({ assortmentId });

  return deletedAssortment;
}
