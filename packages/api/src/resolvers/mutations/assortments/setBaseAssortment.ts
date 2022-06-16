import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { AssortmentNotFoundError, InvalidIdError } from '../../../errors';

export default async function setBaseAssortment(
  root: Root,
  { assortmentId }: { assortmentId: string },
  { modules, userId }: Context,
) {
  log(`mutation setBaseAssortment ${assortmentId}`, { userId });

  if (!assortmentId) throw new InvalidIdError({ assortmentId });

  if (!(await modules.assortments.assortmentExists({ assortmentId })))
    throw new AssortmentNotFoundError({ assortmentId });

  await modules.assortments.setBase(assortmentId, userId);

  return modules.assortments.findAssortment({ assortmentId });
}
