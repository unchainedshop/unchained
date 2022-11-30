import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { Assortment } from '@unchainedshop/types/assortments';
import { AssortmentNotFoundError, InvalidIdError } from '../../../errors';

export default async function updateAssortment(
  root: Root,
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
