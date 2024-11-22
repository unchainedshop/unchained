import { log } from '@unchainedshop/logger';
import { AssortmentNotFoundError, InvalidIdError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function removeAssortment(
  root: never,
  { assortmentId }: { assortmentId: string },
  { modules, userId }: Context,
) {
  log(`mutation removeAssortment ${assortmentId}`, { userId });

  if (!assortmentId) throw new InvalidIdError({ assortmentId });

  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

  await modules.assortments.delete(assortmentId);

  return assortment;
}
