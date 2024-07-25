import { log } from '@unchainedshop/logger';
import { Assortment } from '@unchainedshop/types/assortments.js';
import { AssortmentNotFoundError, InvalidIdError } from '../../../errors.js';
import { Context } from '../../../types.js';

export default async function updateAssortment(
  root: never,
  params: { assortment: Assortment; assortmentId: string },
  { modules, userId }: Context,
) {
  const { assortment, assortmentId } = params;

  log(`mutation updateAssortment ${assortmentId}`, { userId });

  if (!assortmentId) throw new InvalidIdError({ assortmentId });

  if (!(await modules.assortments.assortmentExists({ assortmentId })))
    throw new AssortmentNotFoundError({ assortmentId });

  await modules.assortments.update(assortmentId, assortment);

  return modules.assortments.findAssortment({ assortmentId });
}
