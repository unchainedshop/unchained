import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { AssortmentNotFoundError, InvalidIdError } from '../../../errors';
import { Assortment } from '@unchainedshop/types/assortments';

export default async function updateAssortment(
  root: Root,
  params: { assortment: Assortment; assortmentId: string },
  { modules, userId }: Context
) {
  const { assortment, assortmentId } = params;

  log(`mutation updateAssortment ${assortmentId}`, { modules, userId });

  if (!assortmentId) throw new InvalidIdError({ assortmentId });

  if (!(await modules.assortments.assortmentExists({ assortmentId })))
    throw new AssortmentNotFoundError({ assortmentId });

  await modules.assortments.update(assortmentId, assortment, userId);

  return await modules.assortments.findAssortment({ assortmentId });
}
